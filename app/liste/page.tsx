"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExpenseRow } from "@/components/ExpenseRow";
import { filterExpenses, useStore } from "@/lib/store";
import type { DateFilter } from "@/lib/types";

export default function ListPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<DateFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [methodId, setMethodId] = useState("");

  const items = useMemo(
    () =>
      filterExpenses(
        [...state.expenses].sort((a, b) => b.createdAt - a.createdAt),
        { query, date, categoryId, methodId },
      ),
    [state.expenses, query, date, categoryId, methodId],
  );

  return (
    <main className="px-5 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-muted">
          Geri
        </Link>
        <h1 className="text-[17px] font-semibold">Tüm harcamalar</h1>
        <Link href="/ekle" className="text-sm font-medium">
          Ekle
        </Link>
      </header>

      <label className="sr-only" htmlFor="search">
        Ara
      </label>
      <input
        id="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ara — Migros, Shell…"
        className="field"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="select"
          value={date}
          onChange={(event) => setDate(event.target.value as DateFilter)}
          aria-label="Tarih filtresi"
        >
          <option value="all">Tüm tarihler</option>
          <option value="this-month">Bu ay</option>
          <option value="last-month">Geçen ay</option>
          <option value="this-year">Bu yıl</option>
        </select>
        <select
          className="select"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-label="Kategori filtresi"
        >
          <option value="">Tüm kategoriler</option>
          {state.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={methodId}
          onChange={(event) => setMethodId(event.target.value)}
          aria-label="Ödeme yöntemi filtresi"
        >
          <option value="">Tüm ödemeler</option>
          {state.methods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-sm text-ink-muted">Eşleşen harcama yok.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((expense) => (
            <li key={expense.id}>
              <ExpenseRow
                expense={expense}
                category={state.categories.find(
                  (category) => category.id === expense.categoryId,
                )}
                method={state.methods.find((method) => method.id === expense.methodId)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
