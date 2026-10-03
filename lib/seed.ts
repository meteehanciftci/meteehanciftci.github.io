import { catalogBanks, syncDerived } from "./domain";
import type { AppState } from "./types";

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

export const NAKIT_SOURCE_ID = "m-nakit";

export function createSeedState(): AppState {
  return syncDerived({
    version: 5,
    categories: SEED_CATEGORIES.map((category) => ({ ...category })),
    banks: catalogBanks(),
    paymentSources: [
      {
        id: NAKIT_SOURCE_ID,
        bankId: null,
        name: "Cüzdan",
        type: "cash",
        sortOrder: 0,
        archived: false,
        isDefault: true,
        lastUsedAt: 0,
      },
    ],
    expenses: [],
    settings: {
      currency: "TRY",
      theme: "system",
      hideAmounts: false,
      aiEnabled: false,
      goals: { wantMaxPct: null, luxuryMaxPct: null },
    },
    classCorrections: [],
  });
}
