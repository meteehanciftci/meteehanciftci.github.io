"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HBars, LineChart, Segmented, StackedMonths } from "@/components/Charts";
import { Heatmap } from "@/components/Heatmap";
import { MonthPicker } from "@/components/MonthPicker";
import {
  anomalies,
  balanceScore,
  categoryBreakdown,
  classTotals,
  compareMonths,
  dailySeries,
  heatmapDays,
  methodBreakdown,
  monthExpenses,
  monthThirds,
  monthlyTrend,
  placeBreakdown,
  simulate,
  weekdayBreakdown,
} from "@/lib/analytics";
import { formatMoney, formatMonthTitle, monthAnchor } from "@/lib/format";
import { AI_QUESTIONS, answerQuestion, shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { useViewMonth } from "@/lib/view-month";
import { CLASS_LABEL, type SpendClass } from "@/lib/types";
import { Clock3, Layers3, LayoutDashboard, Store, Tags } from "lucide-react";
import { Icon } from "@/components/Icon";

const TABS = [
  { id: "Genel", icon: LayoutDashboard },
  { id: "Sınıflar", icon: Layers3 },
  { id: "Kategoriler", icon: Tags },
  { id: "Zaman", icon: Clock3 },
  { id: "İşletmeler", icon: Store },
] as const;

export default function SummaryPage() {
  const { state, ledger } = useStore();
  const view = useViewMonth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("Genel");
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
  const anchor = monthAnchor(view.year, view.month);
  const trend = monthlyTrend(ledger, 6, anchor);
  const daily = dailySeries(current);
  const places = placeBreakdown(current);
  const methods = methodBreakdown(state, current);
  const weekdays = weekdayBreakdown(current);
  const thirds = monthThirds(current);
  const heat = heatmapDays(ledger, view.year, view.month);
  const flags = anomalies(current);
  const sim = simulate(current, 0.2, 0.5);
  const score = balanceScore(current, previous, state.settings.goals);
  const cmp = compareMonths(ledger, view.year, view.month);
  const insight = state.settings.aiEnabled && !view.all
    ? shortInsights(state, current, previous, currency, anchor)[0]
    : "";
  const delta = !view.all && cmp.previous.total > 0 ? ((cmp.current.total - cmp.previous.total) / cmp.previous.total) * 100 : null;
  const monthName = formatMonthTitle(view.year, view.month).split(" ")[0];
  const prevName = formatMonthTitle(cmp.prevCursor.year, cmp.prevCursor.month).split(" ")[0];

  return (
    <main className="px-5 pt-6 pb-8">
      <MonthPicker />
      <div className="mt-5 flex gap-4 overflow-x-auto text-[15px]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`press inline-flex items-center gap-1.5 pb-1 ${tab === item.id ? "font-semibold" : "text-ink-muted"}`}
            onClick={() => setTab(item.id)}
          >
            <Icon icon={item.icon} size={18} />
            {item.id}
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
          <Segmented
            parts={[
              { id: "need", label: "İhtiyaç", value: summary.amounts.need, className: "class-bar-need" },
              { id: "want", label: "İstek", value: summary.amounts.want, className: "class-bar-want" },
              { id: "luxury", label: "Lüks", value: summary.amounts.luxury, className: "class-bar-luxury" },
            ]}
            onPick={(id) => router.push(`/liste?class=${id}`)}
          />
          {!view.all ? (
            <div className="mt-8">
              <p className="text-[13px] text-ink-muted">{monthName}</p>
              <p className="text-[28px] font-semibold">{formatMoney(summary.total, currency)}</p>
              {delta != null ? (
                <p className="text-[14px] text-ink-muted">
                  {delta > 0 ? "↑" : "↓"} %{Math.abs(delta).toFixed(1)} · {prevName}’a göre
                </p>
              ) : (
                <p className="text-[14px] text-ink-muted">Önceki ayda kayıt yok.</p>
              )}
              <p className="mt-3 text-[14px]">İhtiyaç {formatMoney(cmp.previous.amounts.need, currency)} → {formatMoney(cmp.current.amounts.need, currency)}</p>
              <p className="text-[14px]">İstek {formatMoney(cmp.previous.amounts.want, currency)} → {formatMoney(cmp.current.amounts.want, currency)}</p>
              <p className="text-[14px]">Lüks {formatMoney(cmp.previous.amounts.luxury, currency)} → {formatMoney(cmp.current.amounts.luxury, currency)}</p>
            </div>
          ) : (
            <p className="mt-4 text-[14px] text-ink-muted">Geçen aya göre karşılaştırma için bir ay seç.</p>
          )}
          <p className="mt-6 text-[13px] text-ink-muted">Harcama dengesi</p>
          <p className="text-[28px] font-semibold">{score} / 100</p>
          {insight ? <p className="mt-4 text-[16px] leading-relaxed">{insight}</p> : null}
          {flags.slice(0, 2).map((flag) => (
            <p key={flag.expense.id} className="mt-2 text-[13px] text-ink-muted">
              {flag.expense.place} · {formatMoney(flag.expense.amount, currency)} — {flag.message}
            </p>
          ))}
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
                  <button key={item.id} type="button" className="row-link" onClick={() => setAnswer(answerQuestion(item.id, state, current, previous, currency, view))}>
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
          <StackedMonths
            rows={trend.map((row) => ({
              label: formatMonthTitle(row.year, row.month).slice(0, 3),
              need: row.amounts.need,
              want: row.amounts.want,
              luxury: row.amounts.luxury,
            }))}
          />
        </section>
      ) : null}

      {tab === "Kategoriler" ? (
        <section className="mt-8">
          <p className="text-[13px] text-ink-muted">En büyük kategori</p>
          <p className="text-[28px] font-semibold">{cats[0] ? formatMoney(cats[0].amount, currency) : formatMoney(0, currency)}</p>
          <p className="text-[14px] text-ink-muted">{cats[0]?.name ?? "Kayıt yok"}</p>
          <HBars
            format={(value) => formatMoney(value, currency)}
            onPick={(id) => router.push(`/liste?cat=${id}`)}
            rows={cats.slice(0, 8).map((row) => ({ id: row.id, label: row.name, value: row.amount }))}
          />
        </section>
      ) : null}

      {tab === "Zaman" ? (
        <section className="mt-6 space-y-8">
          <div>
            <p className="text-[13px] text-ink-muted">Ay içi</p>
            <LineChart points={daily.map(([day, value]) => ({ label: String(day), value }))} />
          </div>
          <HBars
            format={(value) => formatMoney(value, currency)}
            rows={weekdays.map((row) => ({ id: String(row.weekday), label: row.label, value: row.total }))}
          />
          <Heatmap {...heat} currency={currency} />
          <HBars
            format={(value) => formatMoney(value, currency)}
            rows={thirds.map((row) => ({ id: row.id, label: row.label, value: row.total }))}
          />
        </section>
      ) : null}

      {tab === "İşletmeler" ? (
        <section className="mt-6">
          <p className="text-[13px] text-ink-muted">En yüksek işletme</p>
          <p className="text-[28px] font-semibold">{places[0] ? formatMoney(places[0].amount, currency) : formatMoney(0, currency)}</p>
          <p className="text-[14px] text-ink-muted">{places[0]?.place ?? "Kayıt yok"}</p>
          <HBars
            format={(value) => formatMoney(value, currency)}
            onPick={(id) => router.push(`/liste?place=${encodeURIComponent(id)}`)}
            rows={places.slice(0, 8).map((row) => ({ id: row.place, label: row.place, value: row.amount }))}
          />
        </section>
      ) : null}
    </main>
  );
}
