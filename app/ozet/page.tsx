"use client";

import { useMemo, useState } from "react";
import { formatLira, formatMonthTitle, istanbulParts } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function SummaryPage() {
  const { state } = useStore();
  const now = istanbulParts();
  const [cursor, setCursor] = useState({ year: now.year, month: now.month });

  const monthExpenses = useMemo(
    () =>
      state.expenses.filter((expense) => {
        const parts = istanbulParts(expense.createdAt);
        return parts.year === cursor.year && parts.month === cursor.month;
      }),
    [cursor, state.expenses],
  );

  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = state.categories
    .map((category) => ({
      ...category,
      total: monthExpenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const byMethod = state.methods
    .map((method) => ({
      ...method,
      total: monthExpenses
        .filter((expense) => expense.methodId === method.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  function shift(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month - 1 + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
  }

  return (
    <main className="px-5 pt-8">
      <p className="text-[13px] font-medium text-ink-muted">Özet</p>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="h-10 w-10 rounded-full text-lg text-ink-muted"
          aria-label="Önceki ay"
        >
          ‹
        </button>
        <h1 className="text-[18px] font-semibold">
          {formatMonthTitle(cursor.year, cursor.month)}
        </h1>
        <button
          type="button"
          onClick={() => shift(1)}
          className="h-10 w-10 rounded-full text-lg text-ink-muted"
          aria-label="Sonraki ay"
        >
          ›
        </button>
      </div>
      <p className="mt-6 text-[40px] font-semibold leading-none tracking-tight">
        {formatLira(total)}
      </p>
      <p className="mt-2 text-sm text-ink-muted">Aylık toplam</p>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Kategoriler</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-muted">Bu ay kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-line">
            {byCategory.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-3">
                <span>{row.name}</span>
                <span className="tabular-nums font-medium">{formatLira(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Ödeme yöntemleri</h2>
        {byMethod.length === 0 ? (
          <p className="text-sm text-ink-muted">Bu ay kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-line">
            {byMethod.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-3">
                <span>{row.name}</span>
                <span className="tabular-nums font-medium">{formatLira(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
