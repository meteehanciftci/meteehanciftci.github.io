import { istanbulParts } from "./format";
import { LEDGER_KIND, type AppState, type MethodType } from "./types";

export const SEED_CATEGORIES = [
  { id: "cat-market", name: "Market", order: 0 },
  { id: "cat-yeme", name: "Yemek", order: 1 },
  { id: "cat-ulasim", name: "Ulaşım", order: 2 },
  { id: "cat-giyim", name: "Giyim", order: 3 },
  { id: "cat-saglik", name: "Sağlık", order: 4 },
  { id: "cat-ev", name: "Ev", order: 5 },
  { id: "cat-abonelik", name: "Abonelik", order: 6 },
  { id: "cat-eglence", name: "Eğlence", order: 7 },
  { id: "cat-teknoloji", name: "Teknoloji", order: 8 },
  { id: "cat-seyahat", name: "Seyahat", order: 9 },
  { id: "cat-bakim", name: "Kişisel Bakım", order: 10 },
  { id: "cat-diger", name: "Diğer", order: 11 },
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
  return Date.parse(
    `${year}-${pad(month)}-${pad(Math.min(day, 28))}T${pad(hour)}:00:00+03:00`,
  );
}

export function createSeedState(): AppState {
  const expenses = [
    {
      id: "exp-migros-1",
      kind: LEDGER_KIND,
      place: "Migros",
      amount: 1250,
      categoryId: "cat-market",
      methodId: "m-enpara-kk",
      occurredAt: atThisMonth(31, 18, 35),
      createdAt: atThisMonth(31, 18, 35),
      note: "",
    },
    {
      id: "exp-shell",
      kind: LEDGER_KIND,
      place: "Petrol Ofisi",
      amount: 1800,
      categoryId: "cat-ulasim",
      methodId: "m-is-kk",
      occurredAt: atThisMonth(31, 10, 12),
      createdAt: atThisMonth(31, 10, 12),
      note: "",
    },
    {
      id: "exp-kahve",
      kind: LEDGER_KIND,
      place: "Kahve",
      amount: 150,
      categoryId: "cat-yeme",
      methodId: "m-nakit",
      occurredAt: atThisMonth(31, 9, 40),
      createdAt: atThisMonth(31, 9, 40),
      note: "",
    },
    {
      id: "exp-restoran",
      kind: LEDGER_KIND,
      place: "Restoran",
      amount: 850,
      categoryId: "cat-yeme",
      methodId: "m-enpara-kk",
      occurredAt: atThisMonth(30, 21, 10),
      createdAt: atThisMonth(30, 21, 10),
      note: "",
    },
    {
      id: "exp-trendyol",
      kind: LEDGER_KIND,
      place: "Trendyol",
      amount: 2190,
      categoryId: "cat-giyim",
      methodId: "m-enpara-kk",
      occurredAt: atThisMonth(28, 21, 40),
      createdAt: atThisMonth(28, 21, 40),
      note: "",
      installmentCount: 3,
    },
    {
      id: "exp-berber",
      kind: LEDGER_KIND,
      place: "Berber",
      amount: 400,
      categoryId: "cat-bakim",
      methodId: "m-nakit",
      occurredAt: atThisMonth(26, 16, 0),
      createdAt: atThisMonth(26, 16, 0),
      note: "",
    },
    {
      id: "exp-getir",
      kind: LEDGER_KIND,
      place: "Getir",
      amount: 189.5,
      categoryId: "cat-market",
      methodId: "m-enpara-hesap",
      occurredAt: atThisMonth(24, 20, 18),
      createdAt: atThisMonth(24, 20, 18),
      note: "Gece siparişi",
    },
    {
      id: "exp-spotify",
      kind: LEDGER_KIND,
      place: "Spotify",
      amount: 65.99,
      categoryId: "cat-abonelik",
      methodId: "m-enpara-hesap",
      occurredAt: atLastMonth(22, 8),
      createdAt: atLastMonth(22, 8),
      note: "",
    },
    {
      id: "exp-taksi",
      kind: LEDGER_KIND,
      place: "Taksi",
      amount: 240,
      categoryId: "cat-ulasim",
      methodId: "m-nakit",
      occurredAt: atThisMonth(22, 23, 10),
      createdAt: atThisMonth(22, 23, 10),
      note: "",
    },
  ];

  const lastUsed = new Map<string, number>();
  for (const expense of expenses) {
    const prev = lastUsed.get(expense.methodId) ?? 0;
    if (expense.occurredAt > prev) lastUsed.set(expense.methodId, expense.occurredAt);
  }

  return {
    version: 2,
    categories: SEED_CATEGORIES.map((category) => ({ ...category })),
    methods: SEED_METHODS.map((method) => ({
      ...method,
      lastUsedAt: lastUsed.get(method.id) ?? 0,
    })),
    expenses,
    settings: { currency: "TRY", theme: "system" },
  };
}
