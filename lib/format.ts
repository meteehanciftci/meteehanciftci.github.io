const TZ = "Europe/Istanbul";

export function formatAmountTRY(amount: number): string {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} TL`;
}

export function formatLira(amount: number): string {
  return `₺${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))}`;
}

export function formatLiraExact(amount: number): string {
  return `₺${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
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
  }).formatToParts(new Date(ts));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function startOfIstanbulDay(ts: number): number {
  const { year, month, day } = istanbulParts(ts);
  return Date.parse(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+03:00`,
  );
}

export function formatExpenseDate(ts: number, now = Date.now()): string {
  const day = startOfIstanbulDay(ts);
  const today = startOfIstanbulDay(now);
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
  }).format(new Date(ts));
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

export function inDateFilter(
  ts: number,
  filter: "all" | "this-month" | "last-month" | "this-year",
  now = Date.now(),
): boolean {
  if (filter === "all") return true;
  const current = istanbulParts(now);
  const target = istanbulParts(ts);
  if (filter === "this-year") return target.year === current.year;
  if (filter === "this-month") {
    return target.year === current.year && target.month === current.month;
  }
  const lastMonth = current.month === 1 ? 12 : current.month - 1;
  const lastYear = current.month === 1 ? current.year - 1 : current.year;
  return target.year === lastYear && target.month === lastMonth;
}
