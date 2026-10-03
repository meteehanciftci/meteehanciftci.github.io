"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, ReceiptText, Search } from "lucide-react";
import { AmountText } from "@/components/AmountText";
import { ExpenseDetail } from "@/components/ExpenseDetail";
import { FilterSheet } from "@/components/FilterSheet";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { Icon } from "@/components/Icon";
import { MonthPicker } from "@/components/MonthPicker";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { monthExpenses } from "@/lib/analytics";
import { emptyFilters, filtersAreActive, sumExpenses } from "@/lib/domain";
import { filterExpenses, useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import type { ExpenseFilters } from "@/lib/types";

function DefterInner({ initial }: { initial: ExpenseFilters }) {
  const { state, ledger, deleteExpense } = useStore();
  const { openAdd, openEdit, detail, close, setInlineDetail } = useExpenseSheet();
  const view = useViewMonth();
  const [filters, setFilters] = useState<ExpenseFilters>(initial);
  const [searching, setSearching] = useState(Boolean(initial.query));
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 960px)");
    const sync = () => {
      setWide(media.matches);
      setInlineDetail(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      setInlineDetail(false);
    };
  }, [setInlineDetail]);

  const scoped = view.all ? ledger : monthExpenses(ledger, view.year, view.month);
  const items = useMemo(
    () => filterExpenses(scoped, { ...filters, date: view.all && filters.date === "this-month" ? "all" : filters.date }, state)
      .sort((a, b) => b.occurredAt - a.occurredAt),
    [scoped, filters, state, view.all],
  );
  const monthSum = sumExpenses(scoped);
  const filteredSum = sumExpenses(items);
  const filtered = filtersAreActive({ ...filters, date: "all" }) || (filters.date !== "all" && filters.date !== "this-month");

  return (
    <main className="px-5 pt-5 md:px-8">
      <div className={wide ? "grid grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-8" : ""}>
        <div>
          <MonthPicker />
          <p className="mt-6 text-[13px] text-ink-muted">{filtered ? "Filtrelenen toplam" : "Harcama toplamı"}</p>
          <p className="mt-1 text-[40px] font-semibold leading-none tracking-tight">
            <AmountText kurus={filtered ? filteredSum : monthSum} />
          </p>
          <p className="mt-2 text-[14px] text-ink-muted">{items.length} harcama</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary !w-auto px-5" onClick={openAdd}>
              <Icon icon={Plus} size={18} /> Harcama ekle
            </button>
            <button
              type="button"
              className="icon-btn press"
              aria-label="Harcama ara"
              onClick={() => setSearching((open) => !open)}
            >
              <Icon icon={Search} size={22} />
            </button>
            <FilterSheet value={filters} onChange={setFilters} />
          </div>

          {searching ? (
            <label className="mt-3 flex items-center gap-2">
              <Icon icon={Search} size={18} />
              <input
                className="plain min-w-0 flex-1"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Açıklama, kategori veya banka ara"
                autoFocus
              />
            </label>
          ) : null}

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center text-ink-muted">
                <Icon icon={ReceiptText} size={24} />
              </span>
              <p className="text-[16px] font-semibold">Henüz harcama yok</p>
              <p className="mt-1 text-[13px] text-ink-muted">Tutarı gir, kaynağı seç, kaydet.</p>
              <button type="button" className="capsule press mx-auto mt-4" onClick={openAdd}>
                <Icon icon={Plus} size={18} /> Harcama ekle
              </button>
            </div>
          ) : (
            <GroupedExpenseList expenses={items} />
          )}
        </div>

        {wide ? (
          <aside className="sticky top-6 self-start rounded-[28px] border border-line bg-[color:var(--white)] p-6">
            {detail ? (
              <ExpenseDetail
                expense={state.expenses.find((item) => item.id === detail.id) ?? detail}
                onEdit={() => openEdit(detail)}
                onDelete={() => {
                  deleteExpense(detail.id);
                  close();
                }}
              />
            ) : (
              <div className="py-16 text-center text-ink-muted">
                <p className="text-[16px] font-medium text-ink">Kayıt seçilmedi</p>
                <p className="mt-2 text-[14px]">Soldaki listeden bir harcamaya dokunun.</p>
              </div>
            )}
          </aside>
        ) : null}
      </div>
    </main>
  );
}

function DefterFromUrl() {
  const params = useSearchParams();
  const initial: ExpenseFilters = {
    ...emptyFilters(),
    date: "all",
    categoryId: params.get("cat") ?? "",
    bankId: params.get("bank") ?? "",
    paymentSourceId: params.get("source") ?? "",
    methodId: params.get("source") ?? "",
    unspecifiedSource: params.get("source") === "unspecified",
    query: params.get("q") ?? "",
  };
  return <DefterInner key={params.toString()} initial={initial} />;
}

export default function DefterPage() {
  return (
    <Suspense fallback={<main className="px-5 pt-8 text-ink-muted">Yükleniyor…</main>}>
      <DefterFromUrl />
    </Suspense>
  );
}
