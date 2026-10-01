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

function daysAgo(days: number, hour = 12, minute = 0): number {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  now.setDate(now.getDate() - days);
  return now.getTime();
}

export function createSeedState(): AppState {
  const expenses = [
    {
      id: "exp-migros-1",
      place: "Migros",
      amount: 487.9,
      categoryId: "cat-market",
      methodId: "m-enpara-kk",
      createdAt: daysAgo(0, 10, 24),
    },
    {
      id: "exp-shell",
      place: "Shell",
      amount: 1250,
      categoryId: "cat-akaryakit",
      methodId: "m-is-kk",
      createdAt: daysAgo(1, 18, 5),
    },
    {
      id: "exp-starbucks",
      place: "Starbucks",
      amount: 165,
      categoryId: "cat-yeme",
      methodId: "m-nakit",
      createdAt: daysAgo(1, 9, 12),
    },
    {
      id: "exp-trendyol",
      place: "Trendyol",
      amount: 2190,
      categoryId: "cat-giyim",
      methodId: "m-enpara-kk",
      createdAt: daysAgo(3, 21, 40),
    },
    {
      id: "exp-berber",
      place: "Berber",
      amount: 400,
      categoryId: "cat-bakim",
      methodId: "m-nakit",
      createdAt: daysAgo(4, 16, 0),
    },
    {
      id: "exp-getir",
      place: "Getir",
      amount: 189.5,
      categoryId: "cat-market",
      methodId: "m-enpara-hesap",
      createdAt: daysAgo(5, 20, 18),
    },
    {
      id: "exp-spotify",
      place: "Spotify",
      amount: 65.99,
      categoryId: "cat-abonelik",
      methodId: "m-enpara-hesap",
      createdAt: daysAgo(8, 8, 0),
    },
    {
      id: "exp-taksi",
      place: "Taksi",
      amount: 240,
      categoryId: "cat-ulasim",
      methodId: "m-nakit",
      createdAt: daysAgo(9, 23, 10),
    },
    {
      id: "exp-migros-2",
      place: "Migros",
      amount: 1120.4,
      categoryId: "cat-market",
      methodId: "m-enpara-kk",
      createdAt: daysAgo(11, 19, 30),
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
