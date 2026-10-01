import type { CurrencyCode, DateFilter, Period } from "./types";

export const TZ = "Europe/Istanbul";

const symbols: Record<CurrencyCode, string> = {
  TRY: "₺",
  EUR: "€",
  USD: "$",
};

export function formatMoney(amount: number, currency: CurrencyCode = "TRY"): string {
  const whole = Number.isInteger(Math.round(amount * 100) / 100) && amount % 1 === 0;
  const num = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
  return `${num} ${symbols[currency]}`;
}

export const formatLira = (amount: number) => formatMoney(amount, "TRY");

export function formatAmountInput(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  let normalized = trimmed.replace(/[^\d.,]/g, "");

  if (hasComma && hasDot) {
    if (trimmed.lastIndexOf(",") > trimmed.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = normalized.split(".");
    if (parts.length > 2) {
      const dec = parts.pop();
      normalized = `${parts.join("")}.${dec}`;
    }
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export function istanbulParts(ts: number = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(ts));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function startOfIstanbulDay(ts: number): number {
  const { year, month, day } = istanbulParts(ts);
  return Date.parse(`${year}-${pad(month)}-${pad(day)}T00:00:00+03:00`);
}

export function toDatetimeLocal(ts: number): string {
  const p = istanbulParts(ts);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function fromDatetimeLocal(value: string): number {
  if (!value) return Date.now();
  return Date.parse(`${value}:00+03:00`);
}

export function formatClock(ts: number): string {
  const { hour, minute } = istanbulParts(ts);
  return `${pad(hour)}:${pad(minute)}`;
}

export function formatExpenseDate(ts: number, now = Date.now()): string {
  const day = startOfIstanbulDay(ts);
  const today = startOfIstanbulDay(now);
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
}

export function formatDayHeading(ts: number, now = Date.now()): string {
  const day = startOfIstanbulDay(ts);
  const today = startOfIstanbulDay(now);
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "BUGÜN";
  if (diff === 1) return "DÜN";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(ts))
    .toLocaleUpperCase("tr-TR");
}

export function formatRowWhen(ts: number): string {
  const label = formatExpenseDate(ts);
  return `${label} ${formatClock(ts)}`;
}

export function formatMonthTitle(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 15));
  const raw = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return raw.charAt(0).toLocaleUpperCase("tr-TR") + raw.slice(1);
}

export function startOfIsoWeek(ts: number): number {
  const start = startOfIstanbulDay(ts);
  const { year, month, day } = istanbulParts(start);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  return start - mondayOffset * 86_400_000;
}

export function inDateFilter(
  ts: number,
  filter: DateFilter,
  now = Date.now(),
  customFrom?: string,
  customTo?: string,
): boolean {
  if (filter === "all") return true;
  const current = istanbulParts(now);
  const target = istanbulParts(ts);
  if (filter === "today") {
    return startOfIstanbulDay(ts) === startOfIstanbulDay(now);
  }
  if (filter === "this-week") {
    return ts >= startOfIsoWeek(now) && ts <= now + 86_400_000;
  }
  if (filter === "this-month") {
    return target.year === current.year && target.month === current.month;
  }
  if (filter === "last-month") {
    const lastMonth = current.month === 1 ? 12 : current.month - 1;
    const lastYear = current.month === 1 ? current.year - 1 : current.year;
    return target.year === lastYear && target.month === lastMonth;
  }
  if (filter === "custom") {
    const from = customFrom ? Date.parse(`${customFrom}T00:00:00+03:00`) : -Infinity;
    const to = customTo ? Date.parse(`${customTo}T23:59:59+03:00`) : Infinity;
    return ts >= from && ts <= to;
  }
  return true;
}

export function istanbulWeekday(ts: number): number {
  const { year, month, day } = istanbulParts(ts);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function inPeriod(ts: number, period: Period, now = Date.now()): boolean {
  const current = istanbulParts(now);
  const target = istanbulParts(ts);
  if (period === "all") return true;
  if (period === "this-month") {
    return target.year === current.year && target.month === current.month;
  }
  if (period === "last-month") {
    const last = shiftMonth(current.year, current.month, -1);
    return target.year === last.year && target.month === last.month;
  }
  const dayMs = 86_400_000;
  const start = startOfIstanbulDay(now);
  if (period === "7d") return ts >= start - 6 * dayMs;
  if (period === "30d") return ts >= start - 29 * dayMs;
  if (period === "3m") return ts >= start - 90 * dayMs;
  if (period === "6m") return ts >= start - 182 * dayMs;
  if (period === "1y") return ts >= start - 365 * dayMs;
  return true;
}

export const PERIOD_LABEL: Record<Period, string> = {
  "7d": "7 Gün",
  "30d": "30 Gün",
  "this-month": "Bu Ay",
  "last-month": "Geçen Ay",
  "3m": "3 Ay",
  "6m": "6 Ay",
  "1y": "1 Yıl",
  all: "Tümü",
};

export function monthKey(ts: number) {
  const { year, month } = istanbulParts(ts);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function toExpenseDate(ts: number): string {
  const p = istanbulParts(ts);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00`;
}

export function expenseInMonth(
  expense: { occurredAt: number; expenseDate?: string },
  year: number,
  month: number,
) {
  const key = `${year}-${pad(month)}`;
  if (expense.expenseDate && expense.expenseDate.length >= 7) {
    return expense.expenseDate.slice(0, 7) === key;
  }
  const parts = istanbulParts(expense.occurredAt);
  return parts.year === year && parts.month === month;
}
