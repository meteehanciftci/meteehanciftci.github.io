"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClassShare } from "@/components/ClassShare";
import { PeriodPills } from "@/components/PeriodPills";
import { GroupedExpenseList } from "@/components/GroupedExpenseList";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { categoryBreakdown, classTotals, dailySeries, filterByPeriod, previousPeriod } from "@/lib/analytics";
import { formatMoney, formatMonthTitle, istanbulParts } from "@/lib/format";
import { shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { Period, SpendClass } from "@/lib/types";

export default function HomePage() {
  const { state, ledger } = useStore();
  const { openAdd } = useExpenseSheet();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("this-month");
  const now = istanbulParts();
  const currency = state.settings.currency;

  const current = useMemo(() => filterByPeriod(ledger, period), [ledger, period]);
  const previous = useMemo(() => previousPeriod(ledger, period), [ledger, period]);
  const summary = classTotals(current);
  const cats = categoryBreakdown(state, current, previous).slice(0, 5);
  const maxCat = Math.max(1, ...cats.map((row) => row.amount));
  const trend = dailySeries(current);
  const maxDay = Math.max(1, ...trend.map(([, value]) => value));
  const insights = state.settings.aiEnabled ? shortInsights(state, current, previous, currency) : [];
  const recent = [...ledger].sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 5);
  const goals = state.settings.goals;

  function openClass(id: SpendClass) {
    router.push(`/liste?class=${id}`);
  }

  return (
    <main className="px-5 pt-8">
      <p className="text-[13px] font-medium tracking-wide text-ink-muted">Harcama Defteri</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
        {formatMonthTitle(now.year, now.month)}
      </h1>
      <p className="mt-5 text-[40px] font-semibold leading-none tracking-tight">
        {formatMoney(summary.total, currency)}
      </p>
      <p className="mt-2 text-sm text-ink-muted">Toplam harcama</p>

      <div className="mt-6">
        <PeriodPills value={period} onChange={setPeriod} />
      </div>

      <section className="mt-6">
        <ClassShare
          pct={summary.pct}
          amounts={summary.amounts}
          currencyText={(n) => formatMoney(n, currency)}
          onSelect={openClass}
        />
        {goals.wantMaxPct != null || goals.luxuryMaxPct != null ? (
          <div className="mt-4 space-y-1 text-[13px] text-ink-muted">
            {goals.wantMaxPct != null ? (
              <p>
                İstek hedefi: %{goals.wantMaxPct} · Gerçekleşen: %{Math.round(summary.pct.want)}
              </p>
            ) : null}
            {goals.luxuryMaxPct != null ? (
              <p>
                Lüks hedefi: %{goals.luxuryMaxPct} · Gerçekleşen: %{Math.round(summary.pct.luxury)}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <button type="button" className="btn-primary mt-8" onClick={openAdd}>
        + Harcama Ekle
      </button>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Harcama trendi</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-ink-muted">Bu aralıkta kayıt yok.</p>
        ) : (
          <div className="flex h-24 items-end gap-1">
            {trend.map(([day, value]) => (
              <div
                key={day}
                className="min-w-0 flex-1 rounded-t-md bg-ink/80"
                style={{ height: `${Math.max(8, (value / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Kategori dağılımı</h2>
          <Link href="/ozet" className="text-[13px] text-ink-muted">
            Analiz
          </Link>
        </div>
        {cats.length === 0 ? (
          <p className="text-sm text-ink-muted">Veri yok.</p>
        ) : (
          <ul className="space-y-3">
            {cats.map((row) => (
              <li key={row.id}>
                <button type="button" className="w-full text-left" onClick={() => router.push(`/liste?cat=${row.id}`)}>
                  <div className="mb-1 flex justify-between text-[14px]">
                    <span>{row.name}</span>
                    <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${Math.round((row.amount / maxCat) * 100)}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {insights[0] ? (
        <section className="mt-10 rounded-3xl border border-line bg-[color:var(--white)] p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">AI içgörüsü</p>
          <p className="mt-2 text-[15px] leading-relaxed">{insights[0]}</p>
        </section>
      ) : null}

      <section className="mt-10">
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
