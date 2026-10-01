"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { MonthPicker } from "@/components/MonthPicker";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { monthExpenses } from "@/lib/analytics";
import { emptyFilters } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { parseNaturalQuery } from "@/lib/nl-search";
import { filterExpenses, useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import type { ExpenseFilters } from "@/lib/types";

function ListInner({ initial }: { initial: ExpenseFilters }) {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const view = useViewMonth();
  const [filters, setFilters] = useState<ExpenseFilters>(initial);
  const scoped = view.all ? ledger : monthExpenses(ledger, view.year, view.month);

  function onQuery(raw: string) {
    const parsed = parseNaturalQuery(raw);
    setFilters((current) => ({ ...current, ...parsed.patch, query: parsed.query }));
  }

  const items = filterExpenses(scoped, filters, state).sort((a, b) => b.occurredAt - a.occurredAt);
  const total = items.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="px-5 pt-6">
      <MonthPicker />
      <div className="mt-5 flex items-center gap-2">
        <input
          className="plain min-w-0 flex-1"
          value={filters.query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Ara"
        />
        <FilterSheet value={filters} onChange={setFilters} />
      </div>
      <p className="mt-4 text-[15px] text-ink-muted">
        {formatMoney(total, state.settings.currency)} · {items.length} işlem
      </p>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] text-ink-muted">Bu ay için harcama kaydı bulunmuyor.</p>
          <button type="button" className="mt-4 text-[15px] font-semibold" onClick={openAdd}>
            Harcama Ekle
          </button>
        </div>
      ) : (
        <GroupedExpenseList expenses={items} />
      )}
    </main>
  );
}

function ListFromUrl() {
  const params = useSearchParams();
  const spendClass = params.get("class");
  const initial: ExpenseFilters = {
    ...emptyFilters(),
    spendClass: spendClass === "need" || spendClass === "want" || spendClass === "luxury" ? spendClass : "",
    categoryId: params.get("cat") ?? "",
    place: params.get("place") ?? "",
  };
  return <ListInner key={params.toString()} initial={initial} />;
}

export default function ListPage() {
  return (
    <Suspense fallback={<main className="px-5 pt-8 text-ink-muted">Yükleniyor…</main>}>
      <ListFromUrl />
    </Suspense>
  );
}
