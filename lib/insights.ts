import { formatMoney, formatMonthTitle, monthAnchor } from "./format";
import {
  anomalies,
  categoryBreakdown,
  classTotals,
  compareMonths,
  monthThirds,
  monthlyTrend,
  placeBreakdown,
  weekdayBreakdown,
} from "./analytics";
import type { AppState, CurrencyCode, Expense } from "./types";

function pct(n: number) {
  return `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

export function shortInsights(
  state: AppState,
  current: Expense[],
  previous: Expense[],
  currency: CurrencyCode,
  anchor = Date.now(),
): string[] {
  const now = classTotals(current);
  const prev = classTotals(previous);
  const lines: string[] = [];
  if (prev.total <= 0) {
    /* seçili dönemin öncesi yoksa karşılaştırma üretme */
  } else {
    const wantDelta = now.pct.want - prev.pct.want;
    if (Math.abs(wantDelta) >= 3) {
      lines.push(
        `İstek harcamaların oranı geçen döneme göre ${pct(Math.abs(wantDelta))} ${wantDelta > 0 ? "yükseldi" : "düştü"}.`,
      );
    }
    const biggest = categoryBreakdown(state, current, previous)[0];
    if (biggest && Math.abs(biggest.mom) >= 8) {
      const prevAmount = previous
        .filter((e) => e.categoryId === biggest.id)
        .reduce((s, e) => s + e.amountKurus / 100, 0);
      lines.push(
        `${biggest.name} kategorisinde geçen döneme göre ${formatMoney(Math.abs(biggest.amount - prevAmount), currency)} fark var.`,
      );
    }
  }
  const food = categoryBreakdown(state, current).find((row) => /yeme/i.test(row.name));
  if (food && food.classes.total > 0) {
    lines.push(
      `${food.name} harcamalarının ${pct(food.classes.pct.want)}’i İstek olarak sınıflandırılmış.`,
    );
  }
  const trend = monthlyTrend(current.concat(previous), 3, anchor);
  if (trend.length === 3) {
    const richestLuxury = [...trend].sort((a, b) => b.amounts.luxury - a.amounts.luxury)[0];
    if (richestLuxury.amounts.luxury > 0) {
      lines.push(
        `Son dönemde Lüks tutarının en yüksek olduğu ay ${formatMonthTitle(richestLuxury.year, richestLuxury.month)}.`,
      );
    }
  }
  const days = weekdayBreakdown(current).sort((a, b) => b.total - a.total);
  if (days[0]?.total > 0) {
    const top = days[0];
    const discretionary = top.pct.want + top.pct.luxury;
    lines.push(`En yüksek harcama günü ${top.label}. Bu günün ${pct(discretionary)}’i İstek veya Lüks.`);
  }
  const thirds = monthThirds(current);
  if (now.total > 0) {
    const early = thirds[0];
    lines.push(`Harcamalarının ${pct((early.total / now.total) * 100)}’i ayın ilk 10 gününde.`);
  }
  return lines.slice(0, 4);
}

export function answerQuestion(
  questionId: string,
  state: AppState,
  current: Expense[],
  previous: Expense[],
  currency: CurrencyCode,
  period: { year: number; month: number; all: boolean },
): string {
  const now = classTotals(current);
  const cats = categoryBreakdown(state, current, previous);
  const places = placeBreakdown(current);
  const flags = anomalies(current);
  const weekday = weekdayBreakdown(current).sort((a, b) => b.total - a.total)[0];
  if (period.all && (questionId === "mom" || questionId === "luxury" || questionId === "trend")) {
    return "Karşılaştırma için ay seçiciden bir ay seç.";
  }
  const cmp = compareMonths(state.expenses, period.year, period.month);
  const anchor = monthAnchor(period.year, period.month);

  if (questionId === "where") {
    const top = cats[0];
    return `Bu dönemde toplam ${formatMoney(now.total, currency)} harcadın. ${pct(now.pct.need)} İhtiyaç, ${pct(now.pct.want)} İstek, ${pct(now.pct.luxury)} Lüks. En büyük kategori ${top ? `${top.name} (${formatMoney(top.amount, currency)})` : "henüz yok"}.`;
  }
  if (questionId === "mom") {
    if (cmp.previous.total <= 0) return "Karşılaştırma için geçen ayda yeterli kayıt yok.";
    const delta = ((cmp.current.total - cmp.previous.total) / cmp.previous.total) * 100;
    return `Bu ay ${formatMoney(cmp.current.total, currency)}, geçen ay ${formatMoney(cmp.previous.total, currency)} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%). İstek: ${formatMoney(cmp.previous.amounts.want, currency)} → ${formatMoney(cmp.current.amounts.want, currency)}. Lüks: ${formatMoney(cmp.previous.amounts.luxury, currency)} → ${formatMoney(cmp.current.amounts.luxury, currency)}.`;
  }
  if (questionId === "want") {
    const want = current.filter((e) => e.spendClass === "want").sort((a, b) => b.amountKurus - a.amountKurus).slice(0, 5);
    if (!want.length) return "Bu dönemde İstek sınıfında kayıt yok.";
    return `En yüksek İstek kayıtları: ${want.map((e) => `${e.place} ${formatMoney(e.amountKurus / 100, currency)}`).join("; ")}.`;
  }
  if (questionId === "luxury") {
    const delta = cmp.current.amounts.luxury - cmp.previous.amounts.luxury;
    return `Bu ay Lüks ${formatMoney(cmp.current.amounts.luxury, currency)}. Geçen aya göre ${delta >= 0 ? "+" : ""}${formatMoney(delta, currency)}.`;
  }
  if (questionId === "place") {
    const top = places[0];
    return top
      ? `En yüksek tutar ${top.place}: ${formatMoney(top.amount, currency)} (${top.count} kayıt). En sık: ${[...places].sort((a, b) => b.count - a.count)[0]?.place ?? "—"}.`
      : "İşletme kaydı yok.";
  }
  if (questionId === "control") {
    const loose = cats.find((row) => row.classes.pct.want + row.classes.pct.luxury >= 55);
    return loose
      ? `${loose.name} içinde İstek+Lüks oranı ${pct(loose.classes.pct.want + loose.classes.pct.luxury)}. Tutar ${formatMoney(loose.amount, currency)}.`
      : "Kategorilerde belirgin bir İstek/Lüks yığılması görünmüyor.";
  }
  if (questionId === "save") {
    const cut = now.amounts.want * 0.2;
    return `İstek tutarının %20’si ${formatMoney(cut, currency)}. Bu, mevcut kayıtlardan hesaplanan bir simülasyon.`;
  }
  if (questionId === "odd") {
    if (!flags.length) return "Bu dönemde medyandan belirgin sapma gösteren kayıt yok.";
    return flags
      .slice(0, 3)
      .map((flag) => `${flag.expense.place} ${formatMoney(flag.expense.amountKurus / 100, currency)} — ${flag.message}`)
      .join(" ");
  }
  if (questionId === "trend") {
    const months = monthlyTrend(state.expenses, 6, anchor);
    return months
      .map(
        (row) =>
          `${formatMonthTitle(row.year, row.month).split(" ")[0]}: İhtiyaç ${formatMoney(row.amounts.need, currency)}, İstek ${formatMoney(row.amounts.want, currency)}, Lüks ${formatMoney(row.amounts.luxury, currency)}`,
      )
      .join(" · ");
  }
  if (weekday) {
    return `En yüksek gün ${weekday.label} (${formatMoney(weekday.total, currency)}).`;
  }
  return "Bu soru için yeterli kayıt yok.";
}

export const AI_QUESTIONS: { id: string; label: string }[] = [
  { id: "where", label: "Bu ay en çok neye para harcadım?" },
  { id: "mom", label: "Geçen aya göre ne değişti?" },
  { id: "want", label: "En yüksek İstek kayıtlarım hangileri?" },
  { id: "luxury", label: "Lüks harcamalarım arttı mı?" },
  { id: "place", label: "En fazla hangi işletmede para harcıyorum?" },
  { id: "control", label: "Hangi kategoride İstek/Lüks yoğun?" },
  { id: "save", label: "İstek harcamalarımı azaltırsam ne kadar fark eder?" },
  { id: "odd", label: "Bu dönemin sıra dışı harcamaları hangileri?" },
  { id: "trend", label: "Son 6 ayda harcama dağılımı nasıl?" },
];
