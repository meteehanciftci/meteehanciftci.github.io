import { BANK_CATALOG, inferCatalogBankId } from "./banks/catalog";
import { inDateFilter, isExpenseDay, toExpenseDay } from "./format";
import { parseAmountToKurus, sumKurus, tryMajorUnitsToKurus } from "./money";
import { foldTr, namesMatch, normalizeName } from "./text";
import {
  LEDGER_KIND,
  SOURCE_TYPE_LABEL,
  type AppState,
  type Bank,
  type Category,
  type Expense,
  type ExpenseFilters,
  type MethodType,
  type PaymentMethod,
  type PaymentSource,
  type PaymentSourceType,
} from "./types";

export const UNSPECIFIED_SOURCE_LABEL = "Ödeme kaynağı belirtilmemiş";

export function ledgerExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => expense.kind === LEDGER_KIND);
}

export function sourceTypeFromLegacy(type: MethodType | string | undefined, name: string): PaymentSourceType {
  const folded = foldTr(name);
  if (type === "cash" || folded.includes("nakit")) return "cash";
  if (type === "credit" || folded.includes("kredi") || folded.includes("kk")) return "credit_card";
  if (folded.includes("ek hesap") || folded.includes("overdraft")) return "overdraft";
  if (type === "debit" || folded.includes("hesap") || folded.includes("vadesiz")) return "bank_account";
  return "bank_account";
}

export function legacyTypeFromSource(type: PaymentSourceType): MethodType {
  if (type === "cash") return "cash";
  if (type === "credit_card") return "credit";
  return "debit";
}

export function catalogBanks(): Bank[] {
  return BANK_CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    searchNames: entry.searchNames,
    shortCode: entry.shortCode,
    logoKey: entry.logoKey,
    isManual: false,
  }));
}

export function mergeCatalog(banks: Bank[]): Bank[] {
  const map = new Map(banks.map((bank) => [bank.id, bank]));
  for (const entry of catalogBanks()) {
    const existing = map.get(entry.id);
    if (!existing) {
      map.set(entry.id, entry);
      continue;
    }
    if (existing.isManual) continue;
    map.set(entry.id, {
      ...entry,
      name: existing.name || entry.name,
      searchNames: Array.from(new Set([...entry.searchNames, ...existing.searchNames])),
      shortCode: existing.shortCode || entry.shortCode,
      logoKey: existing.logoKey || entry.logoKey,
    });
  }
  return [...map.values()];
}

export function sourcesToMethods(sources: PaymentSource[], banks: Bank[]): PaymentMethod[] {
  return sources.map((source) => {
    const bank = source.bankId ? banks.find((item) => item.id === source.bankId) : undefined;
    return {
      id: source.id,
      name: source.name,
      code: (bank?.shortCode ?? SOURCE_TYPE_LABEL[source.type].slice(0, 3)).toLocaleUpperCase("tr-TR"),
      type: legacyTypeFromSource(source.type),
      lastUsedAt: source.lastUsedAt,
    };
  });
}

export function syncDerived(state: Omit<AppState, "methods"> & { methods?: PaymentMethod[] }): AppState {
  return {
    ...state,
    version: 5,
    methods: sourcesToMethods(state.paymentSources, state.banks),
  };
}

export function bankOfSource(source: PaymentSource | undefined, banks: Bank[]) {
  if (!source?.bankId) return null;
  return banks.find((bank) => bank.id === source.bankId) ?? null;
}

export function sourceOfExpense(expense: Expense, sources: PaymentSource[]) {
  if (!expense.paymentSourceId) return null;
  return sources.find((source) => source.id === expense.paymentSourceId) ?? null;
}

export function defaultSourceId(sources: PaymentSource[]): string | null {
  const active = sources.filter((source) => !source.archived);
  return active.find((source) => source.isDefault)?.id ?? active[0]?.id ?? null;
}

export function selectableSources(sources: PaymentSource[], currentId?: string | null) {
  return [...sources]
    .filter((source) => !source.archived || source.id === currentId)
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.lastUsedAt - a.lastUsedAt;
    });
}

export function recentSources(sources: PaymentSource[], expenses: Expense[], limit = 3) {
  const used = new Map<string, number>();
  for (const expense of ledgerExpenses(expenses)) {
    if (!expense.paymentSourceId) continue;
    const prev = used.get(expense.paymentSourceId) ?? 0;
    if (expense.occurredAt > prev) used.set(expense.paymentSourceId, expense.occurredAt);
  }
  return selectableSources(sources)
    .filter((source) => used.has(source.id))
    .sort((a, b) => (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0))
    .slice(0, limit);
}

export function sourceIsUsed(sourceId: string, expenses: Expense[]) {
  return expenses.some((expense) => expense.paymentSourceId === sourceId);
}

export function groupUserSources(sources: PaymentSource[], banks: Bank[]) {
  const cash = sources.filter((source) => source.type === "cash");
  const byBank = new Map<string, { bank: Bank; sources: PaymentSource[] }>();
  const orphan: PaymentSource[] = [];
  for (const source of sources) {
    if (source.type === "cash") continue;
    const bank = bankOfSource(source, banks);
    if (!bank) {
      orphan.push(source);
      continue;
    }
    const group = byBank.get(bank.id) ?? { bank, sources: [] };
    group.sources.push(source);
    byBank.set(bank.id, group);
  }
  const bankGroups = [...byBank.values()].sort((a, b) =>
    a.bank.name.localeCompare(b.bank.name, "tr"),
  );
  return { cash, bankGroups, orphan };
}

export function userBankCount(sources: PaymentSource[], banks: Bank[]) {
  const ids = new Set(
    sources
      .filter((source) => source.type !== "cash" && source.bankId)
      .map((source) => source.bankId as string),
  );
  return [...ids].filter((id) => banks.some((bank) => bank.id === id)).length;
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
  lookup: { categories: Category[]; paymentSources: PaymentSource[]; banks: Bank[] },
) {
  const query = filters.query.trim();
  const min = filters.minAmount ? parseAmountToKurus(filters.minAmount) : null;
  const max = filters.maxAmount ? parseAmountToKurus(filters.maxAmount) : null;
  const sourceFilter = filters.paymentSourceId || filters.methodId;
  return ledgerExpenses(expenses).filter((expense) => {
    const source = sourceOfExpense(expense, lookup.paymentSources);
    const bank = bankOfSource(source ?? undefined, lookup.banks);
    const category = lookup.categories.find((item) => item.id === expense.categoryId);
    if (query) {
      const hay = [
        expense.place,
        expense.note,
        category?.name ?? "",
        source?.name ?? UNSPECIFIED_SOURCE_LABEL,
        bank?.name ?? "",
        bank?.shortCode ?? "",
      ];
      if (!foldTr(hay.join(" ")).includes(foldTr(query))) return false;
    }
    if (!inDateFilter(expense.occurredAt, filters.date, Date.now(), filters.customFrom, filters.customTo)) {
      return false;
    }
    if (filters.categoryId && expense.categoryId !== filters.categoryId) return false;
    if (filters.unspecifiedSource && expense.paymentSourceId) return false;
    if (sourceFilter && expense.paymentSourceId !== sourceFilter) return false;
    if (filters.bankId) {
      if (!source || source.bankId !== filters.bankId) return false;
    }
    if (filters.spendClass && expense.spendClass !== filters.spendClass) return false;
    if (filters.place && !foldTr(expense.place).includes(foldTr(filters.place))) return false;
    if (min?.ok && expense.amountKurus < min.kurus) return false;
    if (max?.ok && expense.amountKurus > max.kurus) return false;
    return true;
  });
}

export function filtersAreActive(filters: ExpenseFilters) {
  return Boolean(
    filters.query.trim() ||
      (filters.date !== "all" && filters.date !== "this-month") ||
      filters.categoryId ||
      filters.bankId ||
      filters.paymentSourceId ||
      filters.methodId ||
      filters.unspecifiedSource ||
      filters.place ||
      filters.spendClass ||
      filters.minAmount ||
      filters.maxAmount,
  );
}

export function sumExpenses(expenses: Expense[]) {
  return sumKurus(ledgerExpenses(expenses).map((expense) => expense.amountKurus));
}

export function renameSource(state: AppState, id: string, name: string): AppState {
  const clean = normalizeName(name);
  if (!clean) return state;
  return syncDerived({
    ...state,
    paymentSources: state.paymentSources.map((source) =>
      source.id === id ? { ...source, name: clean } : source,
    ),
  });
}

export function archiveSource(state: AppState, id: string, archived: boolean): AppState {
  return syncDerived({
    ...state,
    paymentSources: state.paymentSources.map((source) =>
      source.id === id
        ? { ...source, archived, isDefault: archived ? false : source.isDefault }
        : source,
    ),
  });
}

export function setDefaultSource(state: AppState, id: string): AppState {
  const target = state.paymentSources.find((source) => source.id === id);
  if (!target || target.archived) return state;
  return syncDerived({
    ...state,
    paymentSources: state.paymentSources.map((source) => ({
      ...source,
      isDefault: source.id === id,
    })),
  });
}

export function reorderSource(state: AppState, id: string, direction: -1 | 1): AppState {
  const sorted = [...state.paymentSources].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((source) => source.id === id);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= sorted.length) return state;
  const next = sorted.map((source, order) => ({ ...source, sortOrder: order }));
  const a = next[index];
  const b = next[swap];
  next[index] = { ...b, sortOrder: a.sortOrder };
  next[swap] = { ...a, sortOrder: b.sortOrder };
  return syncDerived({ ...state, paymentSources: next });
}

export function addManualBank(state: AppState, name: string, id: string): { state: AppState; bank: Bank } | null {
  const clean = normalizeName(name);
  if (!clean) return null;
  const existing = state.banks.find((bank) => namesMatch(bank.name, clean));
  if (existing) return { state, bank: existing };
  const bank: Bank = {
    id,
    name: clean,
    searchNames: [clean],
    shortCode: clean.slice(0, 3).toLocaleUpperCase("tr-TR"),
    logoKey: "manual",
    isManual: true,
  };
  return { state: syncDerived({ ...state, banks: [...state.banks, bank] }), bank };
}

export function addPaymentSource(
  state: AppState,
  input: { id: string; bankId: string | null; name: string; type: PaymentSourceType },
): { state: AppState; source: PaymentSource } | null {
  const name = normalizeName(input.name);
  if (!name) return null;
  if (input.type === "cash" && input.bankId) return null;
  if (input.type !== "cash" && !input.bankId) return null;
  if (input.bankId && !state.banks.some((bank) => bank.id === input.bankId)) return null;
  const source: PaymentSource = {
    id: input.id,
    bankId: input.type === "cash" ? null : input.bankId,
    name,
    type: input.type,
    sortOrder: state.paymentSources.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1,
    archived: false,
    isDefault: state.paymentSources.filter((item) => !item.archived).length === 0,
    lastUsedAt: Date.now(),
  };
  return {
    source,
    state: syncDerived({ ...state, paymentSources: [...state.paymentSources, source] }),
  };
}

export function changeExpenseSource(state: AppState, expenseId: string, paymentSourceId: string | null): AppState {
  const sourceOk =
    paymentSourceId == null || state.paymentSources.some((source) => source.id === paymentSourceId);
  if (!sourceOk) return state;
  return syncDerived({
    ...state,
    expenses: state.expenses.map((expense) =>
      expense.id === expenseId
        ? { ...expense, paymentSourceId, updatedAt: Date.now() }
        : expense,
    ),
    paymentSources: state.paymentSources.map((source) =>
      source.id === paymentSourceId ? { ...source, lastUsedAt: Date.now() } : source,
    ),
  });
}

export function migrateLegacyMethods(rawMethods: Record<string, unknown>[]): PaymentSource[] {
  return rawMethods.map((method, index) => {
    const name = String(method.name ?? "Kaynak");
    const type = sourceTypeFromLegacy(String(method.type ?? ""), name);
    const inferred = inferCatalogBankId(name);
    return {
      id: String(method.id ?? `source-${index}`),
      bankId: type === "cash" ? null : (typeof method.bankId === "string" ? method.bankId : inferred),
      name,
      type: (["cash", "bank_account", "credit_card", "overdraft"] as const).includes(
        method.type as PaymentSourceType,
      )
        ? (method.type as PaymentSourceType)
        : type,
      sortOrder: typeof method.sortOrder === "number" ? method.sortOrder : index,
      archived: method.archived === true,
      isDefault: method.isDefault === true,
      lastUsedAt: Number(method.lastUsedAt) || 0,
    };
  });
}

export function resolveAmountKurus(expense: Record<string, unknown>): number {
  if (Number.isSafeInteger(expense.amountKurus) && Number(expense.amountKurus) > 0) {
    return Number(expense.amountKurus);
  }
  return tryMajorUnitsToKurus(expense.amount) ?? 0;
}

export function resolveOccurredOn(expense: Record<string, unknown>, occurredAt: number) {
  if (typeof expense.occurredOn === "string" && isExpenseDay(expense.occurredOn)) {
    return expense.occurredOn;
  }
  return toExpenseDay(occurredAt);
}

export function emptyFilters(): ExpenseFilters {
  return {
    query: "",
    date: "all",
    categoryId: "",
    bankId: "",
    paymentSourceId: "",
    unspecifiedSource: false,
    methodId: "",
    place: "",
    spendClass: "",
    minAmount: "",
    maxAmount: "",
  };
}
