"use client";

import { startOfIstanbulDay, formatDayHeading } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { ExpenseRow } from "./ExpenseRow";
import { useStore } from "@/lib/store";

export function GroupedExpenseList({ expenses }: { expenses: Expense[] }) {
  const { state } = useStore();
  const groups: { key: number; items: Expense[] }[] = [];
  for (const expense of expenses) {
    const key = startOfIstanbulDay(expense.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(expense);
    else groups.push({ key, items: [expense] });
  }

  if (expenses.length === 0) {
    return <p className="py-10 text-sm text-ink-muted">Eşleşen harcama yok.</p>;
  }

  return (
    <div className="pb-4">
      {groups.map((group) => (
        <section key={group.key} className="mt-6 first:mt-2">
          <h2 className="text-[12px] font-semibold tracking-[0.08em] text-ink-muted">
            {formatDayHeading(group.key)}
          </h2>
          <ul className="divide-y divide-line">
            {group.items.map((expense) => (
              <li key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  category={state.categories.find((item) => item.id === expense.categoryId)}
                  method={state.methods.find((item) => item.id === expense.methodId)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
