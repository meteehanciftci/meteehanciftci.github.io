"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { emptyFilters } from "@/lib/filters";
import { parseNaturalQuery } from "@/lib/nl-search";
import { filterExpenses, useStore } from "@/lib/store";
import type { ExpenseFilters } from "@/lib/types";

function filtersFromSearch(search: URLSearchParams): ExpenseFilters {
  const spendClass = search.get("class");
  return {
    ...emptyFilters(),
    spendClass: spendClass === "need" || spendClass === "want" || spendClass === "luxury" ? spendClass : "",
    categoryId: search.get("cat") ?? "",
    place: search.get("place") ?? "",
  };
}

function ListInner({ initial }: { initial: ExpenseFilters }) {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const [filters, setFilters] = useState<ExpenseFilters>(initial);

  function onQuery(raw: string) {
    const parsed = parseNaturalQuery(raw);
    setFilters((current) => ({
      ...current,
      ...parsed.patch,
      query: parsed.query,
    }));
  }

  const items = filterExpenses(ledger, filters, state).sort((a, b) => b.occurredAt - a.occurredAt);

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
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Ara — Migros, geçen ayki lüks"
        />
        <FilterSheet value={filters} onChange={setFilters} />
      </div>
      <GroupedExpenseList expenses={items} />
    </main>
  );
}

function ListFromUrl() {
  const params = useSearchParams();
  return <ListInner key={params.toString()} initial={filtersFromSearch(params)} />;
}

export default function ListPage() {
  return (
    <Suspense fallback={<main className="px-5 pt-8 text-ink-muted">Yükleniyor…</main>}>
      <ListFromUrl />
    </Suspense>
  );
}
