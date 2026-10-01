"use client";

import Link from "next/link";
import { ExpenseRow } from "@/components/ExpenseRow";
import { formatLira, formatMonthTitle, istanbulParts } from "@/lib/format";
import { monthTotal, useStore } from "@/lib/store";

export default function HomePage() {
  const { state } = useStore();
  const now = istanbulParts();
  const total = monthTotal(state.expenses);
  const recent = [...state.expenses]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  return (
    <main className="px-5 pt-8">
      <p className="text-[13px] font-medium tracking-wide text-ink-muted">
        Harcama Defteri
      </p>
      <h1 className="mt-6 text-[15px] font-medium text-ink-muted">Bu Ay</h1>
      <p className="mt-1 text-[40px] font-semibold leading-none tracking-tight">
        {formatLira(total)}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {formatMonthTitle(now.year, now.month)}
      </p>

      <div className="mt-8">
        <Link href="/ekle" className="btn-primary">
          + Harcama Ekle
        </Link>
      </div>

      <section className="mt-10">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Son harcamalar</h2>
          <Link
            href="/liste"
            className="text-[13px] font-medium text-ink-muted underline-offset-2 hover:underline"
          >
            Tümü
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-10 text-sm text-ink-muted">
            Henüz harcama yok. İlk kaydı ekleyin.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((expense) => (
              <li key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  category={state.categories.find(
                    (category) => category.id === expense.categoryId,
                  )}
                  method={state.methods.find(
                    (method) => method.id === expense.methodId,
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
