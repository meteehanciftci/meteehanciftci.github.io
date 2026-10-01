import { istanbulParts } from "./format";
import type { AppState } from "./types";

export const SEED_CATEGORIES = [
  { id: "cat-market", name: "Market" },
  { id: "cat-yeme", name: "Yeme & İçme" },
  { id: "cat-akaryakit", name: "Akaryakıt" },
  { id: "cat-ulasim", name: "Ulaşım" },
  { id: "cat-giyim", name: "Giyim" },
  { id: "cat-ev", name: "Ev" },
  { id: "cat-saglik", name: "Sağlık" },
  { id: "cat-bakim", name: "Kişisel Bakım" },
  { id: "cat-eglence", name: "Eğlence" },
  { id: "cat-abonelik", name: "Abonelik" },
  { id: "cat-diger", name: "Diğer" },
] as const;

export const SEED_METHODS = [
  { id: "m-nakit", name: "Nakit" },
  { id: "m-enpara-kk", name: "Enpara KK" },
  { id: "m-is-kk", name: "İş Bankası KK" },
  { id: "m-enpara-hesap", name: "Enpara Hesap" },
  { id: "m-yk-kk", name: "Yapı Kredi KK" },
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function atThisMonth(day: number, hour: number, minute = 0): number {
  const now = istanbulParts();
  const safeDay = Math.min(Math.max(day, 1), now.day);
  return Date.parse(
    `${now.year}-${pad(now.month)}-${pad(safeDay)}T${pad(hour)}:${pad(minute)}:00+03:00`,
  );
}

function atLastMonth(day: number, hour: number): number {
  const now = istanbulParts();
  const month = now.month === 1 ? 12 : now.month - 1;
  const year = now.month === 1 ? now.year - 1 : now.year;
  const safeDay = Math.min(day, 28);
  return Date.parse(
    `${year}-${pad(month)}-${pad(safeDay)}T${pad(hour)}:00:00+03:00`,
  );
}

export function createSeedState(): AppState {
  const expenses = [
    {
      id: "exp-migros-1",
      place: "Migros",
      amount: 487.9,
      categoryId: "cat-market",
      methodId: "m-enpara-kk",
      createdAt: atThisMonth(31, 10, 24),
    },
    {
      id: "exp-shell",
      place: "Shell",
      amount: 1250,
      categoryId: "cat-akaryakit",
      methodId: "m-is-kk",
      createdAt: atThisMonth(30, 18, 5),
    },
    {
      id: "exp-starbucks",
      place: "Starbucks",
      amount: 165,
      categoryId: "cat-yeme",
      methodId: "m-nakit",
      createdAt: atThisMonth(29, 9, 12),
    },
    {
      id: "exp-trendyol",
      place: "Trendyol",
      amount: 2190,
      categoryId: "cat-giyim",
      methodId: "m-enpara-kk",
      createdAt: atThisMonth(28, 21, 40),
    },
    {
      id: "exp-berber",
      place: "Berber",
      amount: 400,
      categoryId: "cat-bakim",
      methodId: "m-nakit",
      createdAt: atThisMonth(26, 16, 0),
    },
    {
      id: "exp-getir",
      place: "Getir",
      amount: 189.5,
      categoryId: "cat-market",
      methodId: "m-enpara-hesap",
      createdAt: atThisMonth(24, 20, 18),
    },
    {
      id: "exp-spotify",
      place: "Spotify",
      amount: 65.99,
      categoryId: "cat-abonelik",
      methodId: "m-enpara-hesap",
      createdAt: atLastMonth(22, 8),
    },
    {
      id: "exp-taksi",
      place: "Taksi",
      amount: 240,
      categoryId: "cat-ulasim",
      methodId: "m-nakit",
      createdAt: atThisMonth(22, 23, 10),
    },
    {
      id: "exp-migros-2",
      place: "Migros",
      amount: 1120.4,
      categoryId: "cat-market",
      methodId: "m-enpara-kk",
      createdAt: atLastMonth(18, 19),
    },
  ];

  const lastUsed = new Map<string, number>();
  for (const expense of expenses) {
    const prev = lastUsed.get(expense.methodId) ?? 0;
    if (expense.createdAt > prev) lastUsed.set(expense.methodId, expense.createdAt);
  }

  return {
    categories: SEED_CATEGORIES.map((category) => ({ ...category })),
    methods: SEED_METHODS.map((method) => ({
      ...method,
      lastUsedAt: lastUsed.get(method.id) ?? 0,
    })),
    expenses,
  };
}
