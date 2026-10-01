import { istanbulParts } from "./format";
import { LEDGER_KIND, type AppState, type MethodType, type SpendClass } from "./types";

export const SEED_CATEGORIES = [
  { id: "cat-market", name: "Market", order: 0 },
  { id: "cat-yeme", name: "Yeme İçme", order: 1 },
  { id: "cat-yakit", name: "Yakıt", order: 2 },
  { id: "cat-ulasim", name: "Ulaşım", order: 3 },
  { id: "cat-giyim", name: "Giyim", order: 4 },
  { id: "cat-ayakkabi", name: "Ayakkabı", order: 5 },
  { id: "cat-bakim", name: "Kişisel Bakım", order: 6 },
  { id: "cat-ev", name: "Ev", order: 7 },
  { id: "cat-teknoloji", name: "Teknoloji", order: 8 },
  { id: "cat-eglence", name: "Eğlence", order: 9 },
  { id: "cat-hobi", name: "Hobi", order: 10 },
  { id: "cat-saglik", name: "Sağlık", order: 11 },
  { id: "cat-abonelik", name: "Abonelik", order: 12 },
  { id: "cat-seyahat", name: "Seyahat", order: 13 },
  { id: "cat-saat", name: "Saat / Aksesuar", order: 14 },
  { id: "cat-diger", name: "Diğer", order: 15 },
] as const;

export const SEED_METHODS: {
  id: string;
  name: string;
  code: string;
  type: MethodType;
}[] = [
  { id: "m-nakit", name: "Nakit", code: "NKT", type: "cash" },
  { id: "m-enpara-kk", name: "Enpara Kredi Kartı", code: "EPK", type: "credit" },
  { id: "m-enpara-hesap", name: "Enpara Banka Hesabı", code: "EPH", type: "debit" },
  { id: "m-is-kk", name: "İş Bankası Kredi Kartı", code: "ISK", type: "credit" },
  { id: "m-yk-kk", name: "Yapı Kredi Kredi Kartı", code: "YKK", type: "credit" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function atMonth(offset: number, day: number, hour: number, minute = 0): number {
  const now = istanbulParts();
  const date = new Date(now.year, now.month - 1 + offset, 1);
  const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (offset === 0 && day > now.day) {
    return atMonth(-1, day, hour, minute);
  }
  const safeDay = Math.min(Math.max(day, 1), maxDay);
  return Date.parse(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(safeDay)}T${pad(hour)}:${pad(minute)}:00+03:00`,
  );
}

type SeedExpense = {
  id: string;
  place: string;
  amount: number;
  categoryId: string;
  methodId: string;
  spendClass: SpendClass;
  offset: number;
  day: number;
  hour: number;
  minute?: number;
  note?: string;
  installmentCount?: number;
};

const SEED: SeedExpense[] = [
  { id: "exp-migros-1", place: "Migros", amount: 1250, categoryId: "cat-market", methodId: "m-enpara-kk", spendClass: "need", offset: 0, day: 31, hour: 18, minute: 35 },
  { id: "exp-shell", place: "Opet", amount: 1800, categoryId: "cat-yakit", methodId: "m-is-kk", spendClass: "need", offset: 0, day: 31, hour: 10, minute: 12 },
  { id: "exp-kahve", place: "Kahve Dünyası", amount: 150, categoryId: "cat-yeme", methodId: "m-nakit", spendClass: "want", offset: 0, day: 31, hour: 9, minute: 40 },
  { id: "exp-restoran", place: "Restoran", amount: 850, categoryId: "cat-yeme", methodId: "m-enpara-kk", spendClass: "want", offset: 0, day: 30, hour: 21, minute: 10 },
  { id: "exp-trendyol", place: "Trendyol", amount: 2190, categoryId: "cat-giyim", methodId: "m-enpara-kk", spendClass: "want", offset: 0, day: 28, hour: 21, minute: 40, installmentCount: 3 },
  { id: "exp-berber", place: "Berber", amount: 400, categoryId: "cat-bakim", methodId: "m-nakit", spendClass: "need", offset: 0, day: 26, hour: 16 },
  { id: "exp-getir", place: "Getir", amount: 189.5, categoryId: "cat-market", methodId: "m-enpara-hesap", spendClass: "want", offset: 0, day: 24, hour: 20, minute: 18, note: "Gece siparişi" },
  { id: "exp-taksi", place: "Taksi", amount: 240, categoryId: "cat-ulasim", methodId: "m-nakit", spendClass: "need", offset: 0, day: 22, hour: 23, minute: 10 },
  { id: "exp-apple", place: "Apple", amount: 18999, categoryId: "cat-teknoloji", methodId: "m-enpara-kk", spendClass: "luxury", offset: 0, day: 12, hour: 16, installmentCount: 6 },
  { id: "exp-eczane", place: "Eczane", amount: 320, categoryId: "cat-saglik", methodId: "m-enpara-hesap", spendClass: "need", offset: 0, day: 8, hour: 11 },
  { id: "exp-spotify", place: "Spotify", amount: 65.99, categoryId: "cat-abonelik", methodId: "m-enpara-hesap", spendClass: "want", offset: -1, day: 22, hour: 8 },
  { id: "exp-migros-old", place: "Migros", amount: 980, categoryId: "cat-market", methodId: "m-enpara-kk", spendClass: "need", offset: -1, day: 18, hour: 19 },
  { id: "exp-vakko", place: "Vakko", amount: 6400, categoryId: "cat-giyim", methodId: "m-yk-kk", spendClass: "luxury", offset: -1, day: 9, hour: 15 },
  { id: "exp-starbucks", place: "Starbucks", amount: 190, categoryId: "cat-yeme", methodId: "m-nakit", spendClass: "want", offset: -1, day: 14, hour: 10 },
  { id: "exp-opet-old", place: "Opet", amount: 1650, categoryId: "cat-yakit", methodId: "m-is-kk", spendClass: "need", offset: -1, day: 4, hour: 9 },
];

export function createSeedState(): AppState {
  const expenses = SEED.map((item) => {
    const occurredAt = atMonth(item.offset, item.day, item.hour, item.minute ?? 0);
    return {
      id: item.id,
      kind: LEDGER_KIND,
      place: item.place,
      amount: item.amount,
      categoryId: item.categoryId,
      methodId: item.methodId,
      spendClass: item.spendClass,
      occurredAt,
      createdAt: occurredAt,
      note: item.note ?? "",
      installmentCount: item.installmentCount,
    };
  });

  const lastUsed = new Map<string, number>();
  for (const expense of expenses) {
    const prev = lastUsed.get(expense.methodId) ?? 0;
    if (expense.occurredAt > prev) lastUsed.set(expense.methodId, expense.occurredAt);
  }

  return {
    version: 3,
    categories: SEED_CATEGORIES.map((category) => ({ ...category })),
    methods: SEED_METHODS.map((method) => ({
      ...method,
      lastUsedAt: lastUsed.get(method.id) ?? 0,
    })),
    expenses,
    settings: {
      currency: "TRY",
      theme: "system",
      aiEnabled: true,
      goals: { wantMaxPct: 30, luxuryMaxPct: 10 },
    },
    classCorrections: [],
  };
}
