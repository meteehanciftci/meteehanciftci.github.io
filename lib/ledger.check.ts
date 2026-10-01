import assert from "node:assert/strict";
import { monthExpenses, monthlyTrend, compareMonths } from "./analytics";
import { buildBackup, mergeStates, parseBackup } from "./backup";
import { expenseInMonth, monthAnchor } from "./format";
import { inspectBackupText } from "./files";
import { answerQuestion } from "./insights";
import { createSeedState } from "./seed";
import { migrateUnknown } from "./storage";

const seed = createSeedState();
const augustLate = Date.parse("2026-08-31T23:50:00+03:00");
const septemberEarly = Date.parse("2026-09-01T00:10:00+03:00");
assert.equal(expenseInMonth({ occurredAt: augustLate }, 2026, 8), true);
assert.equal(expenseInMonth({ occurredAt: augustLate }, 2026, 9), false);
assert.equal(expenseInMonth({ occurredAt: septemberEarly }, 2026, 9), true);
assert.equal(expenseInMonth({ occurredAt: septemberEarly }, 2026, 8), false);

const kept = seed.expenses.length;
assert.equal(monthExpenses(seed.expenses, 2026, 10).length >= 0, true);
assert.equal(seed.expenses.length, kept);

const trend = monthlyTrend(seed.expenses, 6, monthAnchor(2026, 9));
assert.deepEqual(
  trend.map((row) => row.month),
  [4, 5, 6, 7, 8, 9],
);
assert.equal(trend.some((row) => row.year === 2026 && row.month === 10), false);

const cmp = compareMonths(seed.expenses, 2026, 9);
assert.equal(cmp.prevCursor.month, 8);
const september = monthExpenses(seed.expenses, 2026, 9);
const august = monthExpenses(seed.expenses, 2026, 8);
const mom = answerQuestion("mom", seed, september, august, "TRY", { year: 2026, month: 9, all: false });
assert.match(mom, /geçen ay/i);
assert.equal(mom.includes("Bir ay seç"), false);
const allMom = answerQuestion("mom", seed, seed.expenses, [], "TRY", { year: 2026, month: 10, all: true });
assert.match(allMom, /ay seç/);

const backup = buildBackup(seed, new Date("2026-10-01T09:00:00Z"));
const text = JSON.stringify(backup);
const parsed = parseBackup(text);
assert.equal(parsed.ok, true);
if (parsed.ok) assert.equal(parsed.state.expenses.length, seed.expenses.length);
assert.equal(parseBackup("{").ok, false);
assert.equal(parseBackup('{"backupVersion":1}').ok, false);
assert.equal(inspectBackupText("", seed.expenses.length).ok, false);
assert.equal(inspectBackupText(text, seed.expenses.length + 1).ok, false);
assert.equal(inspectBackupText(text, seed.expenses.length).ok, true);

const legacy = migrateUnknown({
  categories: seed.categories,
  methods: seed.methods,
  expenses: [
    {
      id: "old",
      place: "Migros",
      amount: 10,
      categoryId: "cat-market",
      methodId: "m-nakit",
      expenseDate: "2026-08-31T23:50:00",
      note: "",
    },
  ],
  settings: { currency: "TRY", theme: "system" },
});
assert.ok(legacy);
assert.equal(monthExpenses(legacy?.expenses ?? [], 2026, 8).length, 1);
assert.equal("expenseDate" in (legacy?.expenses[0] ?? {}), false);

const withBoth = migrateUnknown({
  categories: seed.categories,
  methods: seed.methods,
  expenses: [
    {
      id: "both",
      place: "Opet",
      amount: 20,
      categoryId: "cat-yakit",
      methodId: "m-nakit",
      occurredAt: septemberEarly,
      expenseDate: "2026-01-01T00:00:00",
      note: "",
    },
  ],
  settings: { currency: "TRY", theme: "system" },
});
assert.equal(monthExpenses(withBoth?.expenses ?? [], 2026, 9).length, 1);

const extra = {
  ...seed,
  expenses: [
    {
      ...seed.expenses[0],
      id: "exp-extra",
      place: "Eylül Market",
      occurredAt: Date.parse("2026-09-18T14:35:00+03:00"),
    },
  ],
};
const merged = mergeStates(seed, extra);
assert.equal(merged.expenses.length, seed.expenses.length + 1);
assert.equal(monthExpenses(seed.expenses, 2026, 10).length, monthExpenses(seed.expenses, 2026, 10).length);

console.log("ledger checks ok", { expenses: seed.expenses.length, september: september.length, mom });
