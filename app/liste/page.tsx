"use client";

import { useState } from "react";
import Link from "next/link";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { filterExpenses, useStore } from "@/lib/store";
import type { ExpenseFilters } from "@/lib/types";

export default function ListPage() {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const [filters, setFilters] = useState<ExpenseFilters>({
    query: "",
    date: "all",
    categoryId: "",
    methodId: "",
    minAmount: "",
    maxAmount: "",
  });
  const items = filterExpenses(ledger, filters, state).sort(
    (a, b) => b.occurredAt - a.occurredAt,
  );

  return (
    <main className="px-5 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-muted">
          Geri
        </Link>
        <h1 className="text-[17px] font-semibold">Harcamalar</h1>
        <button type="button" className="text-sm font-medium" onClick={openAdd}>
          Ekle
        </button>
      </header>
      <div className="flex gap-2">
        <input
          id="search"
          className="field min-w-0 flex-1"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          placeholder="Ara — yer, kategori, EPK, not"
        />
        <FilterSheet value={filters} onChange={setFilters} />
      </div>
      <GroupedExpenseList expenses={items} />
    </main>
  );
}
