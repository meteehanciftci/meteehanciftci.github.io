import assert from "node:assert/strict";
import { BANK_CATALOG, searchCatalog } from "./banks/catalog";
import { buildBackup, mergeStates, parseBackup } from "./backup";
import {
  addPaymentSource,
  archiveSource,
  changeExpenseSource,
  filterExpenses,
  mergeCatalog,
  renameSource,
  sumExpenses,
} from "./domain";
import { exportCsv } from "./export";
import { expenseInMonth } from "./format";
import { formatKurus, parseAmountToKurus, sumKurus } from "./money";
import { createSeedState } from "./seed";
import { migrateUnknown } from "./storage";
import { foldTr } from "./text";
import type { AppState, Expense } from "./types";

function expense(partial: Partial<Expense> & Pick<Expense, "id" | "amountKurus" | "occurredOn">): Expense {
  const occurredAt = Date.parse(`${partial.occurredOn}T12:00:00+03:00`);
  return {
    kind: "manual",
    place: partial.place ?? "",
    categoryId: partial.categoryId ?? "cat-market",
    paymentSourceId: partial.paymentSourceId ?? "m-nakit",
    spendClass: "need",
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    note: "",
    ...partial,
  };
}

function withExpenses(state: AppState, expenses: Expense[]): AppState {
  return { ...state, expenses };
}

const seed = createSeedState();
assert.equal(seed.version, 5);
assert.equal(seed.expenses.length, 0);
assert.ok(seed.banks.length >= BANK_CATALOG.length);
assert.equal(seed.paymentSources.filter((source) => source.type === "cash").length, 1);
assert.equal(seed.banks.some((bank) => foldTr(bank.name) === "nakit"), false);

const first = parseAmountToKurus("125,50");
const second = parseAmountToKurus("75,25");
assert.equal(first.ok && first.kurus, 12550);
assert.equal(second.ok && second.kurus, 7525);
assert.equal(sumKurus([12550, 7525]), 20075);
assert.equal(formatKurus(20075), "200,75 ₺");

assert.equal(parseAmountToKurus("125").ok && parseAmountToKurus("125").ok ? parseAmountToKurus("125").kurus : 0, 12500);
assert.equal(parseAmountToKurus("1.250,50").ok && parseAmountToKurus("1.250,50").ok ? 125050 : 0, 125050);
assert.equal(parseAmountToKurus("125.50").ok, false);
assert.equal(parseAmountToKurus("0").ok, false);
assert.equal(parseAmountToKurus("-10").ok, false);

let book = withExpenses(seed, [
  expense({ id: "a", amountKurus: 12550, occurredOn: "2026-10-03", paymentSourceId: "m-nakit" }),
  expense({ id: "b", amountKurus: 7525, occurredOn: "2026-10-03", paymentSourceId: "m-nakit" }),
]);
assert.equal(sumExpenses(book.expenses), 20075);

book = withExpenses(book, [
  ...book.expenses,
  expense({ id: "c", amountKurus: 10000, occurredOn: "2026-10-02", paymentSourceId: "m-nakit" }),
]);
assert.equal(sumExpenses(book.expenses), 30075);

const afterFirstHundred = withExpenses(seed, [
  expense({ id: "x", amountKurus: 10000, occurredOn: "2026-10-03" }),
  expense({ id: "y", amountKurus: 7525, occurredOn: "2026-10-03" }),
]);
assert.equal(sumExpenses(afterFirstHundred.expenses), 17525);

let live = afterFirstHundred;
const removed = live.expenses.find((item) => item.id === "y");
live = { ...live, expenses: live.expenses.filter((item) => item.id !== "y") };
assert.equal(sumExpenses(live.expenses), 10000);
live = { ...live, expenses: [removed!, ...live.expenses] };
assert.equal(sumExpenses(live.expenses), 17525);

const isbank = seed.banks.find((bank) => bank.id === "bank-isbank");
assert.ok(isbank);
const createdDaily = addPaymentSource(seed, {
  id: "src-daily",
  bankId: "bank-isbank",
  name: "Günlük hesap",
  type: "bank_account",
});
const createdCard = addPaymentSource(createdDaily!.state, {
  id: "src-card",
  bankId: "bank-isbank",
  name: "Kredi kartım",
  type: "credit_card",
});
assert.ok(createdDaily && createdCard);
let twoSources = withExpenses(createdCard.state, [
  expense({ id: "d1", amountKurus: 10000, occurredOn: "2026-10-03", paymentSourceId: "src-daily" }),
  expense({ id: "d2", amountKurus: 5000, occurredOn: "2026-10-03", paymentSourceId: "src-card" }),
]);
assert.equal(sumExpenses(twoSources.expenses), 15000);
twoSources = changeExpenseSource(twoSources, "d1", "src-card");
assert.equal(sumExpenses(twoSources.expenses), 15000);
assert.equal(twoSources.expenses.find((item) => item.id === "d1")?.paymentSourceId, "src-card");

const bankFilter = filterExpenses(
  twoSources.expenses,
  {
    query: "",
    date: "all",
    categoryId: "",
    bankId: "bank-isbank",
    paymentSourceId: "",
    unspecifiedSource: false,
    methodId: "",
    place: "",
    spendClass: "",
    minAmount: "",
    maxAmount: "",
  },
  twoSources,
);
assert.equal(bankFilter.length, 2);
assert.equal(sumExpenses(bankFilter), 15000);

const oldSourceFilter = filterExpenses(
  twoSources.expenses,
  {
    query: "",
    date: "all",
    categoryId: "",
    bankId: "",
    paymentSourceId: "src-daily",
    unspecifiedSource: false,
    methodId: "",
    place: "",
    spendClass: "",
    minAmount: "",
    maxAmount: "",
  },
  twoSources,
);
assert.equal(oldSourceFilter.length, 0);
const newSourceFilter = filterExpenses(
  twoSources.expenses,
  {
    query: "",
    date: "all",
    categoryId: "",
    bankId: "",
    paymentSourceId: "src-card",
    unspecifiedSource: false,
    methodId: "",
    place: "",
    spendClass: "",
    minAmount: "",
    maxAmount: "",
  },
  twoSources,
);
assert.equal(newSourceFilter.length, 2);

const renamed = renameSource(twoSources, "src-card", "Alışveriş kartım");
assert.equal(renamed.expenses.length, twoSources.expenses.length);
assert.equal(sumExpenses(renamed.expenses), 15000);
assert.equal(renamed.paymentSources.find((source) => source.id === "src-card")?.name, "Alışveriş kartım");
const archived = archiveSource(renamed, "src-card", true);
assert.equal(archived.expenses.length, 2);
assert.equal(sumExpenses(archived.expenses), 15000);
assert.equal(archived.paymentSources.find((source) => source.id === "src-card")?.archived, true);

const legacy = migrateUnknown({
  version: 4,
  categories: seed.categories,
  methods: [
    { id: "m-nakit", name: "Nakit", code: "NKT", type: "cash", lastUsedAt: 1 },
    { id: "m-is-kk", name: "İş Bankası Kredi Kartı", code: "ISK", type: "credit", lastUsedAt: 2 },
  ],
  expenses: [
    {
      id: "old-unspecified",
      place: "Eski kayıt",
      amount: 40,
      categoryId: "cat-market",
      occurredAt: Date.parse("2026-08-31T23:50:00+03:00"),
      note: "",
    },
    {
      id: "old-is",
      place: "Opet",
      amount: 20,
      categoryId: "cat-yakit",
      methodId: "m-is-kk",
      expenseDate: "2026-08-31T23:50:00",
      note: "",
    },
  ],
  settings: { currency: "TRY", theme: "system" },
});
assert.ok(legacy);
assert.equal(legacy?.expenses.find((item) => item.id === "old-unspecified")?.paymentSourceId, null);
assert.equal(legacy?.expenses.find((item) => item.id === "old-is")?.paymentSourceId, "m-is-kk");
assert.equal(legacy?.expenses.find((item) => item.id === "old-is")?.amountKurus, 2000);
assert.equal(legacy?.expenses.find((item) => item.id === "old-is")?.occurredOn, "2026-08-31");
assert.equal(expenseInMonth(legacy!.expenses.find((item) => item.id === "old-is")!, 2026, 8), true);
assert.equal(expenseInMonth(legacy!.expenses.find((item) => item.id === "old-is")!, 2026, 9), false);
assert.equal(legacy?.paymentSources.find((source) => source.id === "m-is-kk")?.bankId, "bank-isbank");

const again = migrateUnknown(legacy);
assert.equal(again?.expenses.length, legacy?.expenses.length);
assert.equal(again?.banks.filter((bank) => bank.id === "bank-isbank").length, 1);
const third = mergeCatalog(mergeCatalog(again!.banks));
assert.equal(third.filter((bank) => bank.id === "bank-isbank").length, 1);

const backup = buildBackup(twoSources, new Date("2026-10-03T09:00:00Z"));
const parsed = parseBackup(JSON.stringify(backup));
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.state.expenses.length, twoSources.expenses.length);
  assert.equal(sumExpenses(parsed.state.expenses), 15000);
  assert.equal(parsed.state.paymentSources.length, twoSources.paymentSources.length);
}
assert.equal(parseBackup("{").ok, false);
assert.equal(parseBackup('{"backupVersion":1}').ok, false);
const brokenKeep = parseBackup("not-json");
assert.equal(brokenKeep.ok, false);

const merged = mergeStates(twoSources, parsed.ok ? parsed.state : twoSources);
assert.equal(merged.expenses.length, twoSources.expenses.length);

const csv = exportCsv(twoSources);
assert.match(csv, /odeme_kaynagi/);
assert.match(csv, /banka/);
assert.equal(csv.includes("=CMD"), false);
const injected = exportCsv({
  ...twoSources,
  expenses: [
    expense({
      id: "inj",
      amountKurus: 100,
      occurredOn: "2026-10-03",
      place: "=CMD",
      paymentSourceId: "src-card",
    }),
  ],
});
assert.match(injected, /"'=CMD"/);

assert.ok(searchCatalog("is bankasi").some((bank) => bank.id === "bank-isbank"));
assert.ok(searchCatalog("İŞ").some((bank) => bank.id === "bank-isbank"));
assert.ok(searchCatalog("garanti").some((bank) => bank.id === "bank-garanti"));

const emptyState = createSeedState();
assert.deepEqual(emptyState.expenses, []);

console.log("denge checks ok", {
  expenses: twoSources.expenses.length,
  banks: twoSources.banks.length,
  sources: twoSources.paymentSources.length,
});
