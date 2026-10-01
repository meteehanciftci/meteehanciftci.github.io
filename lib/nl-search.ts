import type { ExpenseFilters, SpendClass } from "./types";

const CLASS_WORDS: { re: RegExp; spendClass: SpendClass }[] = [
  { re: /\b(ihtiyaç|ihtiyac)\b/i, spendClass: "need" },
  { re: /\bistek\b/i, spendClass: "want" },
  { re: /\b(lüks|luks)\b/i, spendClass: "luxury" },
];

export function parseNaturalQuery(raw: string): { query: string; patch: Partial<ExpenseFilters> } {
  let query = raw.trim();
  const patch: Partial<ExpenseFilters> = {};
  const lower = query.toLocaleLowerCase("tr-TR");

  if (/geçen ay|gecen ay/.test(lower)) {
    patch.date = "last-month";
    query = query.replace(/geçen ayki|geçen aydaki|geçen ay|gecen ayki|gecen ay/gi, "").trim();
  } else if (/bu yıl|bu yil/.test(lower)) {
    patch.date = "all";
    query = query.replace(/bu yılki|bu yilki|bu yıl|bu yil/gi, "").trim();
  } else if (/bu ay/.test(lower)) {
    patch.date = "this-month";
    query = query.replace(/bu ayki|bu aydaki|bu ay/gi, "").trim();
  }

  for (const item of CLASS_WORDS) {
    if (item.re.test(query)) {
      patch.spendClass = item.spendClass;
      query = query.replace(item.re, "").replace(/harcamalar(ı|i)?/gi, "").trim();
    }
  }

  const over = query.match(/(\d+(?:[.,]\d+)?)\s*tl\s*(üzeri|uzeri|üstü|ustu)/i);
  if (over) {
    patch.minAmount = over[1];
    query = query.replace(over[0], "").trim();
  }

  query = query.replace(/^(kayıtlar|kayitlar|harcamalar)\s*/i, "").trim();
  return { query, patch };
}
