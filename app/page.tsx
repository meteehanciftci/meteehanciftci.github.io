"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, Plus, ReceiptText, SlidersHorizontal, Sparkles } from "lucide-react";
import { Diamond, ShieldCheck } from "lucide-react";
import { LineChart } from "@/components/Charts";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { Icon } from "@/components/Icon";
import { MonthPicker } from "@/components/MonthPicker";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { classTotals, dailySeries, monthExpenses } from "@/lib/analytics";
import { formatMoney, monthAnchor, shiftMonth } from "@/lib/format";
import { shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import { CLASS_LABEL, type SpendClass } from "@/lib/types";

const CLASS_ICON = {
  need: ShieldCheck,
  want: Sparkles,
  luxury: Diamond,
} as const;

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
  const insight = state.settings.aiEnabled && !view.all
    ? shortInsights(state, current, previous, currency, monthAnchor(view.year, view.month))[0]
    : "";
  const recent = [...current].sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 5);

  return (
    <main className="px-5 pt-5">
      <MonthPicker />
      <p className="mt-7 text-[13px] text-ink-muted">{view.all ? "Tüm kayıtlar" : "Bu ay harcadın"}</p>
      <p className="mt-1 text-[42px] font-semibold leading-none tracking-tight">
        {formatMoney(summary.total, currency)}
      </p>
      <p className="mt-2 text-[14px] text-ink-muted">{current.length} işlem</p>

      <div className="mt-5 flex gap-2">
        <button type="button" className="capsule press" onClick={openAdd}>
          <Icon icon={Plus} size={18} /> Harcama
        </button>
        <Link href="/ozet" className="capsule press">
          <Icon icon={ChartNoAxesCombined} size={18} /> Analiz
        </Link>
        <Link href="/liste" className="capsule press">
          <Icon icon={SlidersHorizontal} size={18} /> Filtre
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {(["need", "want", "luxury"] as SpendClass[]).map((id) => (
          <Link key={id} href={`/liste?class=${id}`} className="press block">
            <Icon icon={CLASS_ICON[id]} size={18} />
            <p className="mt-2 text-[13px] text-ink-muted">{CLASS_LABEL[id]}</p>
            <p className="mt-1 text-[15px] font-semibold tabular-nums">{formatMoney(summary.amounts[id], currency)}</p>
            <p className="text-[12px] text-ink-muted">%{Math.round(summary.pct[id])}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-[13px] text-ink-muted">Harcama trendi</h2>
        {trend.length === 0 ? (
          <Empty onAdd={openAdd} />
        ) : (
          <LineChart points={trend.map(([day, value]) => ({ label: String(day), value }))} />
        )}
      </section>

      {insight ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[13px] text-ink-muted">
            <Icon icon={Sparkles} size={18} /> AI içgörüsü
          </h2>
          <p className="mt-2 text-[16px] leading-relaxed">{insight}</p>
          <Link href="/ozet" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium">
            Detayları gör
          </Link>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] text-ink-muted">Son harcamalar</h2>
          <Link href="/liste" className="text-[13px] text-ink-muted">
            Tümü
          </Link>
        </div>
        {recent.length === 0 ? <Empty onAdd={openAdd} /> : <GroupedExpenseList expenses={recent} />}
      </section>
    </main>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center text-ink-muted">
        <Icon icon={ReceiptText} size={24} />
      </span>
      <p className="text-[16px] font-semibold">Henüz harcama yok</p>
      <p className="mt-1 text-[13px] text-ink-muted">İlk harcamanı ekleyerek başlayabilirsin.</p>
      <button type="button" className="capsule press mx-auto mt-4" onClick={onAdd}>
        <Icon icon={Plus} size={18} /> Harcama ekle
      </button>
    </div>
  );
}
