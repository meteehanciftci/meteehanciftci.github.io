"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MonthPicker } from "@/components/MonthPicker";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { classTotals, dailySeries, monthExpenses } from "@/lib/analytics";
import { formatMoney, shiftMonth } from "@/lib/format";
import { shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import { CLASS_LABEL, type SpendClass } from "@/lib/types";

export default function HomePage() {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const view = useViewMonth();
  const currency = state.settings.currency;
  const current = useMemo(
    () => (view.all ? ledger : monthExpenses(ledger, view.year, view.month)),
    [ledger, view],
  );
  const previous = useMemo(() => {
    if (view.all) return [];
    const prev = shiftMonth(view.year, view.month, -1);
    return monthExpenses(ledger, prev.year, prev.month);
  }, [ledger, view]);
  const summary = classTotals(current);
  const trend = dailySeries(current);
  const maxDay = Math.max(1, ...trend.map(([, value]) => value));
  const insight = state.settings.aiEnabled ? shortInsights(state, current, previous, currency)[0] : "";
  const recent = [...current].sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 5);

  return (
    <main className="px-5 pt-6">
      <MonthPicker />
      <p className="mt-8 text-[40px] font-semibold leading-none tracking-tight">
        {formatMoney(summary.total, currency)}
      </p>
      <p className="mt-2 text-[14px] text-ink-muted">{view.all ? "Tüm harcamalar" : "Toplam harcama"}</p>
      <p className="mt-4 text-[15px]">
        {(["need", "want", "luxury"] as SpendClass[]).map((id, index) => (
          <span key={id}>
            {index ? "  ·  " : ""}
            {CLASS_LABEL[id]} %{Math.round(summary.pct[id])}
          </span>
        ))}
      </p>

      <section className="mt-8">
        <h2 className="text-[13px] text-ink-muted">Harcama trendi</h2>
        {trend.length === 0 ? (
          <p className="mt-6 text-[15px] text-ink-muted">Bu dönem için harcama kaydı bulunmuyor.</p>
        ) : (
          <div className="mt-4 flex h-16 items-end gap-1">
            {trend.map(([day, value]) => (
              <div
                key={day}
                className="w-1.5 rounded-full bg-ink/80"
                style={{ height: `${Math.max(8, (value / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </section>

      {insight ? (
        <section className="mt-8">
          <h2 className="text-[13px] text-ink-muted">AI içgörüsü</h2>
          <p className="mt-2 text-[16px] leading-relaxed">{insight}</p>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] text-ink-muted">Son işlemler</h2>
          <Link href="/liste" className="text-[13px] text-ink-muted">
            Tümü
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[15px] text-ink-muted">Bu ay için harcama kaydı bulunmuyor.</p>
            <button type="button" className="mt-4 text-[15px] font-semibold" onClick={openAdd}>
              Harcama Ekle
            </button>
          </div>
        ) : (
          <GroupedExpenseList expenses={recent} />
        )}
      </section>
    </main>
  );
}
