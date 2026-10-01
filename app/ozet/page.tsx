"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClassShare } from "@/components/ClassShare";
import { Heatmap } from "@/components/Heatmap";
import { PeriodPills } from "@/components/PeriodPills";
import {
  anomalies,
  balanceScore,
  categoryBreakdown,
  classTotals,
  compareMonths,
  filterByPeriod,
  heatmapDays,
  methodBreakdown,
  monthThirds,
  monthlyTrend,
  placeBreakdown,
  previousPeriod,
  simulate,
  weekdayBreakdown,
} from "@/lib/analytics";
import { formatMoney, formatMonthTitle, istanbulParts } from "@/lib/format";
import { AI_QUESTIONS, answerQuestion, shortInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { CLASS_LABEL, type Period, type SpendClass } from "@/lib/types";

const SECTIONS = [
  { id: "genel", label: "Genel" },
  { id: "sinif", label: "Sınıflar" },
  { id: "kategori", label: "Kategoriler" },
  { id: "isletme", label: "İşletmeler" },
  { id: "zaman", label: "Zaman" },
  { id: "odeme", label: "Ödeme" },
  { id: "ai", label: "Harcama AI" },
] as const;

export default function SummaryPage() {
  const { state, ledger } = useStore();
  const router = useRouter();
  const now = istanbulParts();
  const [period, setPeriod] = useState<Period>("this-month");
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("genel");
  const [answer, setAnswer] = useState("");
  const currency = state.settings.currency;

  const current = useMemo(() => filterByPeriod(ledger, period), [ledger, period]);
  const previous = useMemo(() => previousPeriod(ledger, period), [ledger, period]);
  const summary = classTotals(current);
  const cats = categoryBreakdown(state, current, previous);
  const places = placeBreakdown(current);
  const methods = methodBreakdown(state, current);
  const weekdays = weekdayBreakdown(current);
  const thirds = monthThirds(current);
  const trend = monthlyTrend(ledger, 6);
  const heat = heatmapDays(current, now.year, now.month);
  const flags = anomalies(current);
  const sim = simulate(current, 0.2, 0.5);
  const score = balanceScore(current, previous, state.settings.goals);
  const cmp = compareMonths(ledger, now.year, now.month);
  const insights = state.settings.aiEnabled ? shortInsights(state, current, previous, currency) : [];
  const delta =
    cmp.previous.total > 0 ? ((cmp.current.total - cmp.previous.total) / cmp.previous.total) * 100 : null;

  function openClass(id: SpendClass) {
    router.push(`/liste?class=${id}`);
  }

  return (
    <main className="px-5 pt-8 pb-8">
      <p className="text-[13px] font-medium text-ink-muted">Analiz</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Harcama özeti</h1>
      <div className="mt-5">
        <PeriodPills value={period} onChange={setPeriod} />
      </div>
      <p className="mt-6 text-[36px] font-semibold leading-none tracking-tight">
        {formatMoney(summary.total, currency)}
      </p>
      {delta != null ? (
        <p className="mt-2 text-sm text-ink-muted">
          {formatMonthTitle(cmp.prevCursor.year, cmp.prevCursor.month)} ile karşılaştırma: {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </p>
      ) : null}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? "chip chip-active shrink-0" : "chip shrink-0"}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "genel" || section === "sinif" ? (
        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold">İhtiyaç / İstek / Lüks</h2>
          <ClassShare
            pct={summary.pct}
            amounts={summary.amounts}
            currencyText={(n) => formatMoney(n, currency)}
            onSelect={openClass}
          />
          <div className="mt-6 rounded-3xl border border-line bg-[color:var(--white)] p-4">
            <p className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">Harcama dengesi</p>
            <p className="mt-2 text-[32px] font-semibold">{score} / 100</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              Kişisel tüketim göstergesi: ihtiyaç oranı, istek/lüks payı, önceki döneme göre değişim ve isteğe bağlı
              hedefler. Ahlaki bir puan değildir.
            </p>
          </div>
        </section>
      ) : null}

      {section === "genel" || section === "kategori" ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold">Kategoriler</h2>
          <ul className="space-y-4">
            {cats.map((row) => (
              <li key={row.id}>
                <button type="button" className="w-full text-left" onClick={() => router.push(`/liste?cat=${row.id}`)}>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-medium">{row.name}</span>
                    <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    %{row.pct.toFixed(1)} · geçen döneme göre {row.mom >= 0 ? "+" : ""}
                    {row.mom.toFixed(0)}%
                  </p>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line">
                    {(["need", "want", "luxury"] as SpendClass[]).map((id) =>
                      row.classes.pct[id] > 0 ? (
                        <span key={id} className={`class-bar-${id}`} style={{ width: `${row.classes.pct[id]}%` }} />
                      ) : null,
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {CLASS_LABEL.need} {formatMoney(row.classes.amounts.need, currency)} · {CLASS_LABEL.want}{" "}
                    {formatMoney(row.classes.amounts.want, currency)} · {CLASS_LABEL.luxury}{" "}
                    {formatMoney(row.classes.amounts.luxury, currency)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section === "isletme" ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold">İşletmeler</h2>
          <p className="mb-3 text-[13px] text-ink-muted">
            En sık: {[...places].sort((a, b) => b.count - a.count)[0]?.place ?? "—"}
          </p>
          <ul className="divide-y divide-line">
            {places.slice(0, 12).map((row) => (
              <li key={row.place}>
                <button
                  type="button"
                  className="flex w-full justify-between py-3 text-left"
                  onClick={() => router.push(`/liste?place=${encodeURIComponent(row.place)}`)}
                >
                  <span>
                    {row.place}
                    <span className="ml-2 text-[12px] text-ink-muted">{row.count} kayıt</span>
                  </span>
                  <span className="tabular-nums font-medium">{formatMoney(row.amount, currency)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section === "zaman" || section === "genel" ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold">Aylık trend</h2>
          <ul className="space-y-3">
            {trend.map((row) => (
              <li key={`${row.year}-${row.month}`}>
                <p className="text-[14px] font-medium">{formatMonthTitle(row.year, row.month)}</p>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-line">
                  {(["need", "want", "luxury"] as SpendClass[]).map((id) =>
                    row.pct[id] > 0 ? (
                      <span key={id} className={`class-bar-${id}`} style={{ width: `${row.pct[id]}%` }} />
                    ) : null,
                  )}
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">
                  İhtiyaç {formatMoney(row.amounts.need, currency)} · İstek {formatMoney(row.amounts.want, currency)} ·
                  Lüks {formatMoney(row.amounts.luxury, currency)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section === "zaman" ? (
        <>
          <section className="mt-10">
            <h2 className="mb-3 text-[15px] font-semibold">Isı haritası</h2>
            <Heatmap {...heat} currency={currency} />
          </section>
          <section className="mt-10">
            <h2 className="mb-3 text-[15px] font-semibold">Haftanın günleri</h2>
            <ul className="space-y-2">
              {weekdays.map((row) => (
                <li key={row.weekday} className="flex justify-between text-[14px]">
                  <span>{row.label}</span>
                  <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-10">
            <h2 className="mb-3 text-[15px] font-semibold">Ayın dönemleri</h2>
            {thirds.map((row) => (
              <p key={row.id} className="flex justify-between py-2 text-[14px]">
                <span>{row.label}</span>
                <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
              </p>
            ))}
          </section>
        </>
      ) : null}

      {section === "odeme" ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold">Ödeme yöntemleri</h2>
          <ul className="space-y-4">
            {methods.map((row) => (
              <li key={row.id}>
                <div className="flex justify-between text-[14px]">
                  <span>
                    {row.code} · {row.name}
                  </span>
                  <span className="tabular-nums">{formatMoney(row.amount, currency)}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">
                  İstek payı %{Math.round(row.classes.pct.want)} · Lüks %{Math.round(row.classes.pct.luxury)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section === "ai" ? (
        <section className="mt-10 space-y-5">
          {!state.settings.aiEnabled ? (
            <p className="text-sm text-ink-muted">Harcama AI Ayarlar’dan kapatılmış. Analiz cihaz üzerinde çalışır.</p>
          ) : (
            <>
              <div>
                <h2 className="mb-3 text-[15px] font-semibold">Hazır sorular</h2>
                <div className="flex flex-col gap-2">
                  {AI_QUESTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="rounded-2xl border border-line bg-[color:var(--white)] px-4 py-3 text-left text-[14px]"
                      onClick={() => setAnswer(answerQuestion(item.id, state, current, previous, currency))}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {answer ? <p className="mt-4 text-[15px] leading-relaxed">{answer}</p> : null}
              </div>
              <div className="rounded-3xl border border-line bg-[color:var(--white)] p-4">
                <h2 className="text-[15px] font-semibold">Tasarruf simülasyonu</h2>
                <p className="mt-3 text-[14px]">
                  İstek harcamalarını %20 azaltsaydın bu dönemde{" "}
                  <strong>{formatMoney(sim.want, currency)}</strong> daha az harcayabilirdin.
                </p>
                <p className="mt-2 text-[14px]">
                  Lüks harcamalarını %50 azaltsaydın{" "}
                  <strong>{formatMoney(sim.luxury, currency)}</strong> daha az harcayabilirdin.
                </p>
              </div>
              <div>
                <h2 className="mb-2 text-[15px] font-semibold">Sıra dışı kayıtlar</h2>
                {flags.length === 0 ? (
                  <p className="text-sm text-ink-muted">Belirgin sapma yok.</p>
                ) : (
                  <ul className="space-y-2 text-[14px]">
                    {flags.map((flag) => (
                      <li key={flag.expense.id}>
                        {flag.expense.place} · {formatMoney(flag.expense.amount, currency)} — {flag.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="mb-2 text-[15px] font-semibold">İçgörüler</h2>
                <ul className="space-y-2">
                  {insights.map((line) => (
                    <li key={line} className="text-[14px] leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
