"use client";

import { formatDayHeading, startOfIstanbulDay } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { ExpenseSlip } from "./ExpenseSlip";

export function GroupedExpenseList({
  expenses,
  empty,
}: {
  expenses: Expense[];
  empty?: string;
}) {
  const groups: { key: number; items: Expense[] }[] = [];
  for (const expense of expenses) {
    const key = startOfIstanbulDay(expense.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(expense);
    else groups.push({ key, items: [expense] });
  }

  if (expenses.length === 0) {
    return <p className="py-16 text-center text-[15px] text-ink-muted">{empty ?? "Bu ay için harcama kaydı bulunmuyor."}</p>;
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key} className="mt-6">
          <h2 className="px-1 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {formatDayHeading(group.key)}
          </h2>
          <ul className="mt-1">
            {group.items.map((expense) => (
              <li key={expense.id}>
                <ExpenseSlip expense={expense} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
