"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatMonthTitle, istanbulParts, startOfIstanbulDay } from "@/lib/format";
import { ledgerExpenses } from "@/lib/export";
import { useStore } from "@/lib/store";

export default function SummaryPage() {
  const { state } = useStore();
  const now = istanbulParts();
  const [cursor, setCursor] = useState({ year: now.year, month: now.month });
  const currency = state.settings.currency;

  const monthExpenses = useMemo(
    () =>
      ledgerExpenses(state.expenses).filter((expense) => {
        const parts = istanbulParts(expense.occurredAt);
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

  const byDay = new Map<number, number>();
  for (const expense of monthExpenses) {
    const key = startOfIstanbulDay(expense.occurredAt);
    byDay.set(key, (byDay.get(key) ?? 0) + expense.amount);
  }
  const daily = [...byDay.entries()].sort((a, b) => a[0] - b[0]);
  const maxDay = Math.max(1, ...daily.map(([, value]) => value));

  const byPlace = new Map<string, number>();
  for (const expense of monthExpenses) {
    byPlace.set(expense.place, (byPlace.get(expense.place) ?? 0) + expense.amount);
  }
  const topPlaces = [...byPlace.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
        <button type="button" onClick={() => shift(-1)} className="h-10 w-10 text-lg text-ink-muted" aria-label="Önceki ay">
          ‹
        </button>
        <h1 className="text-[18px] font-semibold">{formatMonthTitle(cursor.year, cursor.month)}</h1>
        <button type="button" onClick={() => shift(1)} className="h-10 w-10 text-lg text-ink-muted" aria-label="Sonraki ay">
          ›
        </button>
      </div>
      <p className="mt-6 text-[40px] font-semibold leading-none tracking-tight">
        {formatMoney(total, currency)}
      </p>
      <p className="mt-2 text-sm text-ink-muted">Bu ay toplam harcama</p>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Kategori dağılımı</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-muted">Bu ay kayıt yok.</p>
        ) : (
          <ul className="space-y-3">
            {byCategory.map((row) => (
              <li key={row.id}>
                <div className="mb-1 flex justify-between text-[14px]">
                  <span>{row.name}</span>
                  <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${Math.round((row.total / total) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Ödeme yöntemi</h2>
        <ul className="space-y-3">
          {byMethod.map((row) => (
            <li key={row.id}>
              <div className="mb-1 flex justify-between text-[14px]">
                <span>
                  {row.code} · {row.name}
                </span>
                <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
              </div>
              <div className="bar">
                <span style={{ width: `${Math.round((row.total / total) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Günlük trend</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-ink-muted">Veri yok.</p>
        ) : (
          <div className="flex h-24 items-end gap-1">
            {daily.map(([day, value]) => (
              <div
                key={day}
                className="min-w-0 flex-1 rounded-t-md bg-ink/80"
                style={{ height: `${Math.max(8, (value / maxDay) * 100)}%` }}
                title={formatMoney(value, currency)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 pb-6">
        <h2 className="mb-3 text-[15px] font-semibold">En çok harcama yapılan yerler</h2>
        <ul className="divide-y divide-line">
          {topPlaces.map(([place, value]) => (
            <li key={place} className="flex justify-between py-3">
              <span>{place}</span>
              <span className="tabular-nums font-medium">{formatMoney(value, currency)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
