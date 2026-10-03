/** Kuruş cinsinden tamsayı para değerleri. Finansal toplamlar yalnızca bunlarla yapılır. */

export const MAX_AMOUNT_KURUS = 9_999_999_999; // 99.999.999,99 TL

export type ParseAmountResult =
  | { ok: true; kurus: number }
  | { ok: false; reason: "empty" | "invalid" | "non_positive" | "overflow" };

function isDigits(value: string) {
  return /^\d+$/.test(value);
}

export function parseAmountToKurus(raw: string): ParseAmountResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (/[eE]/.test(trimmed)) return { ok: false, reason: "invalid" };

  const compact = trimmed.replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(compact)) return { ok: false, reason: "invalid" };

  const commaCount = (compact.match(/,/g) ?? []).length;
  const dotCount = (compact.match(/\./g) ?? []).length;

  let whole: string;
  let fraction = "";

  if (commaCount > 1 && dotCount > 0) {
    return { ok: false, reason: "invalid" };
  }

  if (commaCount === 1) {
    const [left, right] = compact.split(",");
    if (!left || !isDigits(left.replace(/\./g, "")) || !isDigits(right) || right.length > 2) {
      return { ok: false, reason: "invalid" };
    }
    if (dotCount > 0) {
      const groups = left.split(".");
      if (groups.some((group, index) => !isDigits(group) || (index > 0 && group.length !== 3))) {
        return { ok: false, reason: "invalid" };
      }
    } else if (left.includes(".")) {
      return { ok: false, reason: "invalid" };
    }
    whole = left.replace(/\./g, "");
    fraction = right.padEnd(2, "0");
  } else if (commaCount === 0 && dotCount === 0) {
    if (!isDigits(compact)) return { ok: false, reason: "invalid" };
    whole = compact;
    fraction = "00";
  } else if (commaCount === 0 && dotCount === 1) {
    // "125.50" belirsiz: binlik mi ondalık mı? Sessizce dönüştürme.
    return { ok: false, reason: "invalid" };
  } else {
    return { ok: false, reason: "invalid" };
  }

  if (!isDigits(whole) || whole.length === 0) return { ok: false, reason: "invalid" };

  const kurus = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(kurus)) return { ok: false, reason: "overflow" };
  if (kurus <= 0) return { ok: false, reason: "non_positive" };
  if (kurus > MAX_AMOUNT_KURUS) return { ok: false, reason: "overflow" };
  return { ok: true, kurus };
}

export function tryMajorUnitsToKurus(amount: unknown): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  const kurus = Math.round(amount * 100);
  if (!Number.isSafeInteger(kurus) || kurus <= 0 || kurus > MAX_AMOUNT_KURUS) return null;
  return kurus;
}

export function formatKurus(
  kurus: number,
  currency: "TRY" | "EUR" | "USD" = "TRY",
  hidden = false,
): string {
  if (hidden) return "••••";
  const symbols = { TRY: "₺", EUR: "€", USD: "$" };
  const sign = kurus < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(kurus));
  const whole = Math.trunc(abs / 100);
  const fraction = abs % 100;
  const wholeText = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(whole);
  const formatted =
    fraction === 0 ? wholeText : `${wholeText},${String(fraction).padStart(2, "0")}`;
  return `${sign}${formatted} ${symbols[currency]}`;
}

export function sumKurus(values: number[]): number {
  let total = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value)) throw new Error("Geçersiz kuruş değeri");
    total += value;
    if (!Number.isSafeInteger(total) || total > MAX_AMOUNT_KURUS * 8) {
      throw new Error("Toplam taştı");
    }
  }
  return total;
}

export function amountErrorMessage(reason: ParseAmountResult extends { ok: false } ? ParseAmountResult["reason"] : never) {
  if (reason === "empty") return "Tutar girin.";
  if (reason === "non_positive") return "Gider tutarı sıfırdan büyük olmalı.";
  if (reason === "overflow") return "Tutar üst sınırı aşıyor.";
  return "Tutar anlaşılamadı. 125, 125,50 veya 1.250,50 yazın.";
}
