"use client";

import Link from "next/link";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { formatMoney } from "@/lib/format";
import { filterExpenses, monthTotal, todayTotal, useStore } from "@/lib/store";
import { useState } from "react";
import type { ExpenseFilters } from "@/lib/types";

const emptyFilters = (): ExpenseFilters => ({
  query: "",
  date: "all",
  categoryId: "",
  methodId: "",
  minAmount: "",
  maxAmount: "",
});

export default function HomePage() {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const [filters, setFilters] = useState<ExpenseFilters>(emptyFilters);
  const month = monthTotal(ledger);
  const today = todayTotal(ledger);
  const recent = filterExpenses(ledger, filters, state)
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 12);

  return (
    <main className="px-5 pt-8">
      <p className="text-[13px] font-medium tracking-wide text-ink-muted">Harcama Defteri</p>
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[15px] text-ink-muted">Bu Ay</p>
          <p className="mt-1 text-[32px] font-semibold leading-none tracking-tight">
            {formatMoney(month, state.settings.currency)}
          </p>
        </div>
        <div>
          <p className="text-[15px] text-ink-muted">Bugün</p>
          <p className="mt-1 text-[32px] font-semibold leading-none tracking-tight">
            {formatMoney(today, state.settings.currency)}
          </p>
        </div>
      </div>

      <button type="button" className="btn-primary mt-8" onClick={openAdd}>
        + Harcama Ekle
      </button>

      <div className="mt-8 flex gap-2">
        <input
          className="field min-w-0 flex-1"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          placeholder="Ara — Migros, EPK, not…"
        />
        <FilterSheet value={filters} onChange={setFilters} />
      </div>

      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Son harcamalar</h2>
          <Link href="/liste" className="text-[13px] font-medium text-ink-muted">
            Tümü
          </Link>
        </div>
        <GroupedExpenseList expenses={recent} />
      </section>
    </main>
  );
}
