"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heatmap } from "@/components/Heatmap";
import { MonthPicker } from "@/components/MonthPicker";
import {
  anomalies,
  balanceScore,
  categoryBreakdown,
  classTotals,
  compareMonths,
  heatmapDays,
  methodBreakdown,
  monthExpenses,
  monthThirds,
  monthlyTrend,
  placeBreakdown,
  simulate,
  weekdayBreakdown,
} from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { AI_QUESTIONS, answerQuestion, shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import { CLASS_LABEL, type SpendClass } from "@/lib/types";

const TABS = ["Genel", "Sınıflar", "Kategoriler", "Zaman", "İşletmeler"] as const;

export default function SummaryPage() {
  const { state, ledger } = useStore();
  const view = useViewMonth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Genel");
  const [answer, setAnswer] = useState("");
  const currency = state.settings.currency;
  const current = useMemo(
    () => (view.all ? ledger : monthExpenses(ledger, view.year, view.month)),
    [ledger, view],
  );
  const previous = useMemo(() => {
    if (view.all) return [];
    const month = view.month === 1 ? 12 : view.month - 1;
    const year = view.month === 1 ? view.year - 1 : view.year;
    return monthExpenses(ledger, year, month);
  }, [ledger, view]);
  const summary = classTotals(current);
  const cats = categoryBreakdown(state, current, previous);
  const trend = monthlyTrend(ledger, 6);
  const places = placeBreakdown(current);
  const methods = methodBreakdown(state, current);
  const weekdays = weekdayBreakdown(current);
  const thirds = monthThirds(current);
  const heat = heatmapDays(ledger, view.year, view.month);
  const flags = anomalies(current);
  const sim = simulate(current, 0.2, 0.5);
  const score = balanceScore(current, previous, state.settings.goals);
  const cmp = compareMonths(ledger, view.year, view.month);
  const insight = state.settings.aiEnabled ? shortInsights(state, current, previous, currency)[0] : "";
  const delta = cmp.previous.total > 0 ? ((cmp.current.total - cmp.previous.total) / cmp.previous.total) * 100 : null;

  return (
    <main className="px-5 pt-6 pb-8">
      <MonthPicker />
      <div className="mt-5 flex gap-4 overflow-x-auto text-[15px]">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? "font-semibold" : "text-ink-muted"}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Genel" ? (
        <section className="mt-8">
          <p className="text-[13px] text-ink-muted">Toplam</p>
          <p className="mt-1 text-[36px] font-semibold tracking-tight">{formatMoney(summary.total, currency)}</p>
          {delta != null ? (
            <p className="mt-1 text-[14px] text-ink-muted">Geçen aya göre {delta > 0 ? "+" : ""}{delta.toFixed(1)}%</p>
          ) : null}
          <p className="mt-6 text-[15px]">
            İhtiyaç %{Math.round(summary.pct.need)} · İstek %{Math.round(summary.pct.want)} · Lüks %{Math.round(summary.pct.luxury)}
          </p>
          <p className="mt-6 text-[13px] text-ink-muted">Harcama dengesi</p>
          <p className="text-[28px] font-semibold">{score} / 100</p>
          {insight ? <p className="mt-4 text-[16px] leading-relaxed">{insight}</p> : null}
          <div className="mt-6">
            {methods.slice(0, 4).map((row) => (
              <p key={row.id} className="flex justify-between py-2 text-[15px]">
                <span>{row.code}</span>
                <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
              </p>
            ))}
          </div>
          {state.settings.aiEnabled ? (
            <div className="mt-8">
              <h2 className="text-[13px] text-ink-muted">Harcama AI</h2>
              <div className="mt-2">
                {AI_QUESTIONS.map((item) => (
                  <button key={item.id} type="button" className="row-link" onClick={() => setAnswer(answerQuestion(item.id, state, current, previous, currency))}>
                    {item.label}
                  </button>
                ))}
              </div>
              {answer ? <p className="mt-3 text-[15px] leading-relaxed">{answer}</p> : null}
              <p className="mt-4 text-[14px] text-ink-muted">
                İstekleri %20 azaltsan {formatMoney(sim.want, currency)} · Lüksü %50 azaltsan {formatMoney(sim.luxury, currency)}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "Sınıflar" ? (
        <section className="mt-8 space-y-4">
          {(["need", "want", "luxury"] as SpendClass[]).map((id) => (
            <button key={id} type="button" className="block w-full text-left" onClick={() => router.push(`/liste?class=${id}`)}>
              <p className="text-[13px] text-ink-muted">{CLASS_LABEL[id]}</p>
              <p className="text-[28px] font-semibold tabular-nums">{formatMoney(summary.amounts[id], currency)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <span className={`block h-full class-bar-${id}`} style={{ width: `${summary.pct[id]}%` }} />
              </div>
            </button>
          ))}
          <div className="pt-4">
            {trend.map((row) => (
              <p key={`${row.year}-${row.month}`} className="flex justify-between py-2 text-[14px]">
                <span>{row.month}/{row.year}</span>
                <span className="tabular-nums text-ink-muted">
                  {formatMoney(row.amounts.need, currency)} · {formatMoney(row.amounts.want, currency)} · {formatMoney(row.amounts.luxury, currency)}
                </span>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "Kategoriler" ? (
        <ul className="mt-6">
          {cats.map((row) => (
            <li key={row.id}>
              <button type="button" className="w-full py-3 text-left" onClick={() => router.push(`/liste?cat=${row.id}`)}>
                <div className="flex justify-between">
                  <span className="font-medium">{row.name}</span>
                  <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">
                  %{row.pct.toFixed(0)} · {row.mom >= 0 ? "+" : ""}{row.mom.toFixed(0)}%
                  {" · "}
                  İhtiyaç {formatMoney(row.classes.amounts.need, currency)} · İstek {formatMoney(row.classes.amounts.want, currency)} · Lüks {formatMoney(row.classes.amounts.luxury, currency)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "Zaman" ? (
        <section className="mt-6 space-y-8">
          <Heatmap {...heat} currency={currency} />
          <div>
            {weekdays.map((row) => (
              <p key={row.weekday} className="flex justify-between py-1.5 text-[15px]">
                <span>{row.label}</span>
                <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
              </p>
            ))}
          </div>
          <div>
            {thirds.map((row) => (
              <p key={row.id} className="flex justify-between py-1.5 text-[15px]">
                <span>{row.label}</span>
                <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
              </p>
            ))}
          </div>
          <div>
            {trend.map((row) => (
              <p key={`${row.year}-${row.month}`} className="flex justify-between py-1.5 text-[15px]">
                <span>{row.month}.{row.year}</span>
                <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
              </p>
            ))}
          </div>
          {flags.slice(0, 3).map((flag) => (
            <p key={flag.expense.id} className="text-[14px] text-ink-muted">
              {flag.expense.place} · {formatMoney(flag.expense.amount, currency)} — {flag.message}
            </p>
          ))}
        </section>
      ) : null}

      {tab === "İşletmeler" ? (
        <ul className="mt-4">
          {places.slice(0, 12).map((row) => (
            <li key={row.place}>
              <button type="button" className="row-link" onClick={() => router.push(`/liste?place=${encodeURIComponent(row.place)}`)}>
                <span>
                  {row.place}
                  <span className="ml-2 text-[12px] text-ink-muted">{row.count}</span>
                </span>
                <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
