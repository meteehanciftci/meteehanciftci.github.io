import { CLASS_LABEL, type AppState, type Expense, type SpendClass } from "./types";

export type ClassSuggestion = {
  spendClass: SpendClass;
  confidence: number;
  source: "user" | "place" | "category" | "heuristic";
  warning?: string;
};

const NEED_CAT = /market|yakıt|yakit|ulaşım|ulasim|sağlık|saglik|ev/;
const WANT_CAT = /yeme|eğlence|eglence|hobi|abonelik|giyim|ayakkabı|ayakkabi|bakım|bakim/;
const LUX_CAT = /saat|aksesuar|teknoloji|seyahat/;

const NEED_PLACE = /migros|bim|a101|şok|sok|opet|shell|po |petrol|eczane|metro|iett|tıbbi|tibbi/;
const WANT_PLACE = /starbucks|kahve|getir|yemeksepeti|trendyol|zara|bershka|spotify|netflix|youtube/;
const LUX_PLACE = /rolex|omega|louis|gucci|prada|apple store|vakko|beymen|four seasons/;

function catName(state: AppState, categoryId: string) {
  return (state.categories.find((c) => c.id === categoryId)?.name ?? "").toLocaleLowerCase("tr-TR");
}

function placeKey(place: string) {
  return place.trim().toLocaleLowerCase("tr-TR");
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function majority(classes: SpendClass[]): { spendClass: SpendClass; confidence: number } | null {
  if (!classes.length) return null;
  const counts: Record<SpendClass, number> = { need: 0, want: 0, luxury: 0 };
  for (const item of classes) counts[item] += 1;
  const winner = (Object.entries(counts) as [SpendClass, number][]).sort((a, b) => b[1] - a[1])[0];
  return { spendClass: winner[0], confidence: winner[1] / classes.length };
}

export function suggestSpendClass(
  state: AppState,
  input: { place: string; amount: number; categoryId: string },
): ClassSuggestion {
  const place = placeKey(input.place);
  const category = catName(state, input.categoryId);
  const ledger = state.expenses;

  const corrections = state.classCorrections.filter(
    (row) =>
      placeKey(row.place) === place ||
      (place && placeKey(row.place).includes(place)) ||
      (row.categoryId === input.categoryId && placeKey(row.place) === place),
  );
  const recentSamePlace = corrections.filter((row) => placeKey(row.place) === place).slice(0, 8);
  if (recentSamePlace.length >= 2) {
    const maj = majority(recentSamePlace.map((row) => row.chosen));
    if (maj && maj.confidence >= 0.6) {
      return withAmountCheck(state, input, {
        spendClass: maj.spendClass,
        confidence: Math.min(0.94, 0.7 + maj.confidence * 0.2),
        source: "user",
      });
    }
  }

  const placeHistory = ledger.filter((row) => placeKey(row.place) === place);
  if (placeHistory.length >= 2) {
    const maj = majority(placeHistory.map((row) => row.spendClass));
    if (maj && maj.confidence >= 0.55) {
      return withAmountCheck(state, input, {
        spendClass: maj.spendClass,
        confidence: Math.min(0.9, 0.62 + maj.confidence * 0.22),
        source: "place",
      });
    }
  }

  if (LUX_PLACE.test(place) || (LUX_CAT.test(category) && input.amount >= 8000)) {
    return withAmountCheck(state, input, { spendClass: "luxury", confidence: 0.78, source: "heuristic" });
  }
  if (NEED_PLACE.test(place) || NEED_CAT.test(category)) {
    return withAmountCheck(state, input, { spendClass: "need", confidence: 0.74, source: "heuristic" });
  }
  if (WANT_PLACE.test(place) || WANT_CAT.test(category)) {
    return withAmountCheck(state, input, { spendClass: "want", confidence: 0.8, source: "heuristic" });
  }

  const catHistory = ledger.filter((row) => row.categoryId === input.categoryId);
  if (catHistory.length >= 3) {
    const maj = majority(catHistory.map((row) => row.spendClass));
    if (maj) {
      return withAmountCheck(state, input, {
        spendClass: maj.spendClass,
        confidence: Math.min(0.72, 0.5 + maj.confidence * 0.2),
        source: "category",
      });
    }
  }

  if (input.amount >= 15000) {
    return { spendClass: "luxury", confidence: 0.55, source: "heuristic" };
  }
  return { spendClass: "want", confidence: 0.42, source: "heuristic" };
}

function withAmountCheck(
  state: AppState,
  input: { place: string; amount: number; categoryId: string },
  suggestion: ClassSuggestion,
): ClassSuggestion {
  const samePlace = state.expenses.filter((row) => placeKey(row.place) === placeKey(input.place));
  const sameCat = state.expenses.filter((row) => row.categoryId === input.categoryId);
  const sample = (samePlace.length >= 3 ? samePlace : sameCat).map((row) => row.amountKurus / 100);
  if (sample.length < 3 || input.amount <= 0) return suggestion;
  const mid = median(sample);
  if (mid > 0 && input.amount >= mid * 4 && input.amount >= 2500) {
    return {
      ...suggestion,
      confidence: Math.max(0.35, suggestion.confidence - 0.25),
      warning: `Bu tutar bu yer/kategorideki tipik harcamanın oldukça üzerinde (medyan ${Math.round(mid).toLocaleString("tr-TR")} ₺). Sınıfı kontrol etmek ister misin?`,
    };
  }
  return suggestion;
}

export function formatSuggestion(suggestion: ClassSuggestion) {
  const pct = Math.round(suggestion.confidence * 100);
  return `AI önerisi: ${CLASS_LABEL[suggestion.spendClass]} · %${pct} güven`;
}

export function inferLegacyClass(
  expense: Pick<Expense, "place" | "categoryId" | "note"> & { amount?: number; amountKurus?: number },
  state: AppState,
): SpendClass {
  const amount = expense.amount ?? (expense.amountKurus ? expense.amountKurus / 100 : 0);
  return suggestSpendClass(state, { place: expense.place, amount, categoryId: expense.categoryId }).spendClass;
}
