"use client";

import { Suspense, useState } from "react";
import { Plus, ReceiptText, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { Icon } from "@/components/Icon";
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
  const [searching, setSearching] = useState(Boolean(initial.query));
  const scoped = view.all ? ledger : monthExpenses(ledger, view.year, view.month);

  function onQuery(raw: string) {
    const parsed = parseNaturalQuery(raw);
    setFilters((current) => ({ ...current, ...parsed.patch, query: parsed.query }));
  }

  const items = filterExpenses(scoped, filters, state).sort((a, b) => b.occurredAt - a.occurredAt);
  const total = items.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="px-5 pt-3">
      <header className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Harcamalar</h1>
        <div className="flex items-center">
          <button type="button" className="icon-btn press" aria-label="Harcama ara" onClick={() => setSearching((open) => !open)}>
            <Icon icon={Search} size={22} />
          </button>
          <FilterSheet value={filters} onChange={setFilters} iconOnly />
        </div>
      </header>
      <div className="mt-1">
        <MonthPicker />
      </div>
      {searching ? (
        <label className="mt-2 flex items-center gap-2">
          <Icon icon={Search} size={18} />
          <input
            className="plain min-w-0 flex-1"
            value={filters.query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Harcama ara"
            autoFocus
          />
        </label>
      ) : null}
      <p className="mt-3 text-[15px] text-ink-muted">
        {formatMoney(total, state.settings.currency)} · {items.length} işlem
      </p>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center text-ink-muted">
            <Icon icon={ReceiptText} size={24} />
          </span>
          <p className="text-[16px] font-semibold">Henüz harcama yok</p>
          <p className="mt-1 text-[13px] text-ink-muted">İlk harcamanı ekleyerek başlayabilirsin.</p>
          <button type="button" className="capsule press mx-auto mt-4" onClick={openAdd}>
            <Icon icon={Plus} size={18} /> Harcama ekle
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
