import { expenseInMonth, istanbulParts, istanbulWeekday, inPeriod, monthKey, shiftMonth, startOfIstanbulDay } from "./format";
import type { AppState, Expense, Period, SpendClass } from "./types";

export const CLASS_ORDER: SpendClass[] = ["need", "want", "luxury"];

export function classTotals(expenses: Expense[]) {
  const totals: Record<SpendClass, number> = { need: 0, want: 0, luxury: 0 };
  let total = 0;
  for (const expense of expenses) {
    totals[expense.spendClass] += expense.amountKurus / 100;
    total += expense.amountKurus / 100;
  }
  const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  return {
    total,
    amounts: totals,
    pct: { need: pct(totals.need), want: pct(totals.want), luxury: pct(totals.luxury) },
  };
}

export function filterByPeriod(expenses: Expense[], period: Period, now = Date.now()) {
  return expenses.filter((expense) => inPeriod(expense.occurredAt, period, now));
}

export function monthExpenses(expenses: Expense[], year: number, month: number) {
  return expenses.filter((expense) => expenseInMonth(expense, year, month));
}

export function monthlyTrend(expenses: Expense[], months = 6, now = Date.now()) {
  const current = istanbulParts(now);
  const rows = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const cursor = shiftMonth(current.year, current.month, -i);
    const slice = monthExpenses(expenses, cursor.year, cursor.month);
    rows.push({ ...cursor, ...classTotals(slice) });
  }
  return rows;
}

export function categoryBreakdown(state: AppState, expenses: Expense[], previous?: Expense[]) {
  const prevMap = new Map<string, number>();
  for (const expense of previous ?? []) {
    prevMap.set(expense.categoryId, (prevMap.get(expense.categoryId) ?? 0) + (expense.amountKurus / 100));
  }
  const total = expenses.reduce((sum, expense) => sum + (expense.amountKurus / 100), 0);
  return state.categories
    .map((category) => {
      const slice = expenses.filter((expense) => expense.categoryId === category.id);
      const amount = slice.reduce((sum, expense) => sum + (expense.amountKurus / 100), 0);
      const prev = prevMap.get(category.id) ?? 0;
      const mom = prev > 0 ? ((amount - prev) / prev) * 100 : amount > 0 ? 100 : 0;
      return {
        ...category,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
        mom,
        classes: classTotals(slice),
      };
    })
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function placeBreakdown(expenses: Expense[]) {
  const map = new Map<string, { amount: number; count: number }>();
  for (const expense of expenses) {
    const prev = map.get(expense.place) ?? { amount: 0, count: 0 };
    map.set(expense.place, { amount: prev.amount + (expense.amountKurus / 100), count: prev.count + 1 });
  }
  return [...map.entries()]
    .map(([place, stats]) => ({ place, ...stats }))
    .sort((a, b) => b.amount - a.amount);
}

export function methodBreakdown(state: AppState, expenses: Expense[]) {
  return state.paymentSources
    .map((method) => {
      const slice = expenses.filter((expense) => expense.paymentSourceId === method.id);
      return { ...method, amount: slice.reduce((s, e) => s + e.amountKurus / 100, 0), classes: classTotals(slice) };
    })
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function weekdayBreakdown(expenses: Expense[]) {
  const labels = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return labels.map((label, weekday) => {
    const slice = expenses.filter((expense) => istanbulWeekday(expense.occurredAt) === weekday);
    return { weekday, label, ...classTotals(slice) };
  });
}

export function monthThirds(expenses: Expense[]) {
  const buckets = [
    { id: "early", label: "1–10", slice: [] as Expense[] },
    { id: "mid", label: "11–20", slice: [] as Expense[] },
    { id: "late", label: "21–Ay sonu", slice: [] as Expense[] },
  ];
  for (const expense of expenses) {
    const day = istanbulParts(expense.occurredAt).day;
    if (day <= 10) buckets[0].slice.push(expense);
    else if (day <= 20) buckets[1].slice.push(expense);
    else buckets[2].slice.push(expense);
  }
  return buckets.map((bucket) => ({ id: bucket.id, label: bucket.label, ...classTotals(bucket.slice) }));
}

export function heatmapDays(expenses: Expense[], year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const byDay = new Map<number, number>();
  for (const expense of expenses) {
    const p = istanbulParts(expense.occurredAt);
    if (p.year === year && p.month === month) {
      byDay.set(p.day, (byDay.get(p.day) ?? 0) + (expense.amountKurus / 100));
    }
  }
  const max = Math.max(1, ...byDay.values());
  return { daysInMonth, mondayOffset, byDay, max };
}

export function anomalies(expenses: Expense[]): { expense: Expense; message: string }[] {
  const byCat = new Map<string, number[]>();
  for (const expense of expenses) {
    const list = byCat.get(expense.categoryId) ?? [];
    list.push((expense.amountKurus / 100));
    byCat.set(expense.categoryId, list);
  }
  const medians = new Map<string, number>();
  for (const [id, values] of byCat) {
    if (values.length < 3) continue;
    const sorted = [...values].sort((a, b) => a - b);
    medians.set(id, sorted[Math.floor(sorted.length / 2)]);
  }
  const flags: { expense: Expense; message: string }[] = [];
  for (const expense of expenses) {
    const mid = medians.get(expense.categoryId);
    if (!mid || mid <= 0) continue;
    if ((expense.amountKurus / 100) >= mid * 4 && (expense.amountKurus / 100) >= 1500) {
      flags.push({
        expense,
        message: `Bu kategoride tek işlem medyanın ${Math.round((expense.amountKurus / 100) / mid)} katı.`,
      });
    }
  }
  return flags.sort((a, b) => b.expense.amountKurus - a.expense.amountKurus).slice(0, 8);
}

export function balanceScore(expenses: Expense[], previous: Expense[], goals: AppState["settings"]["goals"]) {
  const now = classTotals(expenses);
  const prev = classTotals(previous);
  let score = 70;
  score += Math.min(18, now.pct.need * 0.18);
  score -= Math.min(16, Math.max(0, now.pct.want - 35) * 0.45);
  score -= Math.min(20, Math.max(0, now.pct.luxury - 12) * 0.8);
  if (prev.total > 0) {
    const delta = (now.total - prev.total) / prev.total;
    score -= Math.min(10, Math.max(0, delta) * 20);
    score += Math.min(8, Math.max(0, -delta) * 16);
  }
  if (goals.wantMaxPct != null && now.pct.want > goals.wantMaxPct) {
    score -= Math.min(10, now.pct.want - goals.wantMaxPct);
  }
  if (goals.luxuryMaxPct != null && now.pct.luxury > goals.luxuryMaxPct) {
    score -= Math.min(12, (now.pct.luxury - goals.luxuryMaxPct) * 1.2);
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function simulate(expenses: Expense[], wantCut: number, luxuryCut: number) {
  const now = classTotals(expenses);
  return {
    want: now.amounts.want * wantCut,
    luxury: now.amounts.luxury * luxuryCut,
  };
}

export function dailySeries(expenses: Expense[]) {
  const map = new Map<number, number>();
  for (const expense of expenses) {
    const key = startOfIstanbulDay(expense.occurredAt);
    map.set(key, (map.get(key) ?? 0) + (expense.amountKurus / 100));
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export function compareMonths(expenses: Expense[], year: number, month: number) {
  const current = monthExpenses(expenses, year, month);
  const prevCursor = shiftMonth(year, month, -1);
  const previous = monthExpenses(expenses, prevCursor.year, prevCursor.month);
  return {
    current: classTotals(current),
    previous: classTotals(previous),
    prevCursor,
  };
}

export function previousPeriod(expenses: Expense[], period: Period, now = Date.now()) {
  if (period === "this-month") {
    const c = istanbulParts(now);
    const p = shiftMonth(c.year, c.month, -1);
    return monthExpenses(expenses, p.year, p.month);
  }
  if (period === "last-month") {
    const c = istanbulParts(now);
    const p = shiftMonth(c.year, c.month, -2);
    return monthExpenses(expenses, p.year, p.month);
  }
  const span =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "3m" ? 90 : period === "6m" ? 182 : period === "1y" ? 365 : 0;
  if (!span) return [];
  const start = startOfIstanbulDay(now) - span * 86_400_000;
  const prevStart = start - span * 86_400_000;
  return expenses.filter((expense) => expense.occurredAt >= prevStart && expense.occurredAt < start);
}

export { monthKey };
