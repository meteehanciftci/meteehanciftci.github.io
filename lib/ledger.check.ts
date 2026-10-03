import assert from "node:assert/strict";
import { expenseInMonth } from "./format";
import { buildBackup, parseBackup } from "./backup";
import { inspectBackupText } from "./files";
import { createSeedState } from "./seed";
import { migrateUnknown } from "./storage";

const seed = createSeedState();
const augustLate = Date.parse("2026-08-31T23:50:00+03:00");
const septemberEarly = Date.parse("2026-09-01T00:10:00+03:00");
assert.equal(expenseInMonth({ occurredAt: augustLate, occurredOn: "2026-08-31" }, 2026, 8), true);
assert.equal(expenseInMonth({ occurredAt: augustLate, occurredOn: "2026-08-31" }, 2026, 9), false);
assert.equal(expenseInMonth({ occurredAt: septemberEarly, occurredOn: "2026-09-01" }, 2026, 9), true);
assert.equal(expenseInMonth({ occurredAt: septemberEarly, occurredOn: "2026-09-01" }, 2026, 8), false);

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
  methods: seed.paymentSources.map((source) => ({
    id: source.id,
    name: source.name,
    code: "NKT",
    type: source.type === "cash" ? "cash" : "debit",
    lastUsedAt: 0,
  })),
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
assert.equal(legacy?.expenses[0]?.occurredOn, "2026-08-31");
assert.equal(legacy?.expenses[0]?.amountKurus, 1000);

console.log("ledger checks ok", { expenses: seed.expenses.length });
