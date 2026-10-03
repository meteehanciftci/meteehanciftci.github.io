import { emptyFilters as domainEmpty } from "./domain";
import type { ExpenseFilters, SpendClass } from "./types";

export function emptyFilters(): ExpenseFilters {
  return domainEmpty();
}

export function withClass(spendClass: SpendClass, extra: Partial<ExpenseFilters> = {}): ExpenseFilters {
  return { ...emptyFilters(), spendClass, ...extra };
}
