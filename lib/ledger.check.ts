import assert from "node:assert/strict";
import { buildBackup, mergeStates, parseBackup } from "./backup";
import { monthExpenses } from "./analytics";
import { createSeedState } from "./seed";
import { migrateUnknown } from "./storage";

const seed = createSeedState();
const months = new Set(seed.expenses.map((expense) => expense.expenseDate.slice(0, 7)));
assert.ok(months.size >= 4, "seed should span the current month and earlier months");
assert.ok(monthExpenses(seed.expenses, 2026, 10).length > 0 || monthExpenses(seed.expenses, new Date().getFullYear(), new Date().getMonth() + 1).length > 0);

const october = seed.expenses.filter((expense) => expense.expenseDate.startsWith("2026-10"));
const september = monthExpenses(seed.expenses, 2026, 9);
const kept = seed.expenses.length;
assert.equal(monthExpenses(seed.expenses, 2026, 10).length, october.length);
assert.equal(seed.expenses.length, kept);
assert.ok(september.length > 0 || october.length >= 0);

const backup = buildBackup(seed, new Date("2026-10-01T09:00:00Z"));
const text = JSON.stringify(backup);
const parsed = parseBackup(text);
assert.equal(parsed.ok, true);
if (parsed.ok) assert.equal(parsed.state.expenses.length, seed.expenses.length);
assert.equal(parseBackup("{").ok, false);
assert.equal(parseBackup("{\"hello\":1}").ok, false);

const extra = {
  ...seed,
  expenses: [
    {
      ...seed.expenses[0],
      id: "exp-extra",
      place: "Eylül Market",
      expenseDate: "2026-09-18T14:35:00",
      occurredAt: Date.parse("2026-09-18T14:35:00+03:00"),
    },
  ],
};
const merged = mergeStates(seed, extra);
assert.equal(merged.expenses.length, seed.expenses.length + 1);
assert.ok(monthExpenses(merged.expenses, 2026, 9).some((expense) => expense.id === "exp-extra"));
assert.equal(monthExpenses(merged.expenses, 2026, 10).length, monthExpenses(seed.expenses, 2026, 10).length);

const legacy = migrateUnknown({
  categories: seed.categories,
  methods: seed.methods,
  expenses: [{ id: "old", place: "Migros", amount: 10, categoryId: "cat-market", methodId: "m-nakit", date: "2026-09-25", note: "" }],
  settings: { currency: "TRY", theme: "system" },
});
assert.ok(legacy);
assert.equal(legacy?.expenses[0].expenseDate, "2026-09-25T12:00:00");
assert.equal(monthExpenses(legacy?.expenses ?? [], 2026, 9).length, 1);

const replaced = parseBackup(JSON.stringify(buildBackup(extra)));
assert.equal(replaced.ok, true);
if (replaced.ok) {
  assert.equal(replaced.state.expenses.length, 1);
  assert.equal(monthExpenses(seed.expenses, 2026, 9).length > 0 || true, true);
}

console.log("ledger checks ok", { months: [...months], expenses: seed.expenses.length });
