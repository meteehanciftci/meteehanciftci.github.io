import type { ExpenseFilters, SpendClass } from "@/lib/types";

export function emptyFilters(): ExpenseFilters {
  return {
    query: "",
    date: "all",
    categoryId: "",
    methodId: "",
    place: "",
    spendClass: "",
    minAmount: "",
    maxAmount: "",
  };
}

export function withClass(spendClass: SpendClass, extra: Partial<ExpenseFilters> = {}): ExpenseFilters {
  return { ...emptyFilters(), spendClass, ...extra };
}
