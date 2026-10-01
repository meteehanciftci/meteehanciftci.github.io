"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { inDateFilter, toExpenseDate } from "./format";
import { createId } from "./ids";
import { ledgerExpenses } from "./export";
import { createSeedState } from "./seed";
import { loadState, pullNewerFromIdb, saveState } from "./storage";
import { LEDGER_KIND, type AppState, type Category, type Expense, type ExpenseDraft, type ExpenseFilters, type MethodType, type PaymentMethod, type Settings } from "./types";

type StoreValue = {
  ready: boolean;
  state: AppState;
  ledger: Expense[];
  addExpense: (input: ExpenseDraft) => Expense;
  updateExpense: (id: string, patch: Partial<ExpenseDraft>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (name: string) => Category | null;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  addMethod: (input: { name: string; code: string; type: MethodType }) => PaymentMethod | null;
  updateMethod: (id: string, patch: Partial<Pick<PaymentMethod, "name" | "code" | "type">>) => void;
  deleteMethod: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importBackup: (state: AppState) => void;
  suggestionForPlace: (place: string) => { categoryId: string; methodId: string; spendClass: Expense["spendClass"] } | null;
  places: string[];
};

const StoreContext = createContext<StoreValue | null>(null);

const listeners = new Set<() => void>();
let memory: AppState | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!pulling && typeof window !== "undefined") {
    pulling = true;
    void pullNewerFromIdb().then((next) => {
      pulling = false;
      if (!next) return;
      memory = next;
      emit();
    });
  }
  return () => listeners.delete(listener);
}

let pulling = false;

function getSnapshot() {
  if (!memory) memory = loadState();
  return memory;
}

const SERVER_SNAPSHOT = createSeedState();
const getServerSnapshot = () => SERVER_SNAPSHOT;

function commit(next: AppState) {
  memory = next;
  saveState(next);
  emit();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function rememberCorrection(state: AppState, expense: Expense): AppState["classCorrections"] {
  if (!expense.aiSuggestedClass || expense.aiSuggestedClass === expense.spendClass) {
    return state.classCorrections;
  }
  return [
    {
      place: expense.place,
      categoryId: expense.categoryId,
      chosen: expense.spendClass,
      suggested: expense.aiSuggestedClass,
      at: Date.now(),
    },
    ...state.classCorrections,
  ].slice(0, 400);
}

function subscribeIsClient(onChange: () => void) {
  queueMicrotask(onChange);
  return () => {};
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeIsClient, () => true, () => false);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<StoreValue>(() => {
    const addExpense: StoreValue["addExpense"] = (input) => {
      const expense: Expense = {
        id: createId(),
        kind: LEDGER_KIND,
        place: normalizeName(input.place),
        amount: input.amount,
        categoryId: input.categoryId,
        methodId: input.methodId,
        spendClass: input.spendClass,
        aiSuggestedClass: input.aiSuggestedClass,
        occurredAt: input.occurredAt,
        expenseDate: toExpenseDate(input.occurredAt),
        createdAt: Date.now(),
        note: input.note.trim(),
        installmentCount:
          input.installmentCount && input.installmentCount > 1
            ? input.installmentCount
            : undefined,
      };
      commit({
        ...state,
        expenses: [expense, ...state.expenses],
        classCorrections: rememberCorrection(state, expense),
        methods: state.methods.map((method) =>
          method.id === expense.methodId
            ? { ...method, lastUsedAt: expense.occurredAt }
            : method,
        ),
      });
      return expense;
    };

    const updateExpense: StoreValue["updateExpense"] = (id, patch) => {
      const existing = state.expenses.find((item) => item.id === id);
      if (!existing || existing.kind !== LEDGER_KIND) return;
      const nextExpense: Expense = {
        ...existing,
        ...patch,
        kind: LEDGER_KIND,
        place: patch.place ? normalizeName(patch.place) : existing.place,
        note: patch.note != null ? patch.note.trim() : existing.note,
        occurredAt: patch.occurredAt ?? existing.occurredAt,
        expenseDate: toExpenseDate(patch.occurredAt ?? existing.occurredAt),
        installmentCount:
          patch.installmentCount && patch.installmentCount > 1
            ? patch.installmentCount
            : patch.installmentCount === 1
              ? undefined
              : existing.installmentCount,
      };
      commit({
        ...state,
        expenses: state.expenses.map((item) => (item.id === id ? nextExpense : item)),
        classCorrections: rememberCorrection(state, nextExpense),
        methods: state.methods.map((method) =>
          method.id === nextExpense.methodId
            ? { ...method, lastUsedAt: Date.now() }
            : method,
        ),
      });
    };

    const deleteExpense: StoreValue["deleteExpense"] = (id) => {
      commit({
        ...state,
        expenses: state.expenses.filter((item) => item.id !== id),
      });
    };

    const addCategory: StoreValue["addCategory"] = (name) => {
      const clean = normalizeName(name);
      if (!clean) return null;
      if (
        state.categories.some(
          (category) =>
            category.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR"),
        )
      ) {
        return null;
      }
      const order = state.categories.reduce((max, category) => Math.max(max, category.order), -1) + 1;
      const category = { id: createId(), name: clean, order };
      commit({ ...state, categories: [...state.categories, category] });
      return category;
    };

    const updateCategory: StoreValue["updateCategory"] = (id, name) => {
      const clean = normalizeName(name);
      if (!clean) return;
      commit({
        ...state,
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, name: clean } : category,
        ),
      });
    };

    const deleteCategory: StoreValue["deleteCategory"] = (id) => {
      const fallback =
        state.categories.find((category) => category.name === "Diğer")?.id ??
        state.categories.find((category) => category.id !== id)?.id;
      if (!fallback || fallback === id) return;
      commit({
        ...state,
        categories: state.categories.filter((category) => category.id !== id),
        expenses: state.expenses.map((expense) =>
          expense.categoryId === id ? { ...expense, categoryId: fallback } : expense,
        ),
      });
    };

    const moveCategory: StoreValue["moveCategory"] = (id, direction) => {
      const sorted = [...state.categories].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((category) => category.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= sorted.length) return;
      const a = sorted[index];
      const b = sorted[swap];
      commit({
        ...state,
        categories: state.categories.map((category) => {
          if (category.id === a.id) return { ...category, order: b.order };
          if (category.id === b.id) return { ...category, order: a.order };
          return category;
        }),
      });
    };

    const addMethod: StoreValue["addMethod"] = (input) => {
      const name = normalizeName(input.name);
      const code = normalizeName(input.code).toLocaleUpperCase("tr-TR").slice(0, 6);
      if (!name || !code) return null;
      if (
        state.methods.some(
          (method) =>
            method.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR") ||
            method.code === code,
        )
      ) {
        return null;
      }
      const method: PaymentMethod = {
        id: createId(),
        name,
        code,
        type: input.type,
        lastUsedAt: Date.now(),
      };
      commit({ ...state, methods: [...state.methods, method] });
      return method;
    };

    const updateMethod: StoreValue["updateMethod"] = (id, patch) => {
      commit({
        ...state,
        methods: state.methods.map((method) =>
          method.id === id
            ? {
                ...method,
                ...patch,
                name: patch.name ? normalizeName(patch.name) : method.name,
                code: patch.code
                  ? normalizeName(patch.code).toLocaleUpperCase("tr-TR").slice(0, 6)
                  : method.code,
              }
            : method,
        ),
      });
    };

    const deleteMethod: StoreValue["deleteMethod"] = (id) => {
      if (state.methods.length <= 1) return;
      const fallback = state.methods.find((method) => method.id !== id)?.id;
      if (!fallback) return;
      commit({
        ...state,
        methods: state.methods.filter((method) => method.id !== id),
        expenses: state.expenses.map((expense) =>
          expense.methodId === id ? { ...expense, methodId: fallback } : expense,
        ),
      });
    };

    const updateSettings: StoreValue["updateSettings"] = (patch) => {
      commit({ ...state, settings: { ...state.settings, ...patch } });
    };

    const importBackup: StoreValue["importBackup"] = (next) => {
      commit(next);
    };

    const suggestionForPlace: StoreValue["suggestionForPlace"] = (place) => {
      const needle = normalizeName(place).toLocaleLowerCase("tr-TR");
      if (!needle) return null;
      const match = ledgerExpenses(state.expenses).find(
        (expense) => expense.place.toLocaleLowerCase("tr-TR") === needle,
      );
      if (!match) return null;
      return { categoryId: match.categoryId, methodId: match.methodId, spendClass: match.spendClass };
    };

    const ledger = ledgerExpenses(state.expenses);
    const places = Array.from(new Set(ledger.map((expense) => expense.place)));

    return {
      ready: true,
      state,
      ledger,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      moveCategory,
      addMethod,
      updateMethod,
      deleteMethod,
      updateSettings,
      importBackup,
      suggestionForPlace,
      places,
    };
  }, [state]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-ink-muted">
        Yükleniyor…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore StoreProvider içinde kullanılmalı");
  return ctx;
}

export function useSortedMethods() {
  const { state } = useStore();
  return [...state.methods].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export function useSortedCategories() {
  const { state } = useStore();
  return [...state.categories].sort((a, b) => a.order - b.order);
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
  lookup: { categories: Category[]; methods: PaymentMethod[] },
) {
  const query = filters.query.trim().toLocaleLowerCase("tr-TR");
  const min = filters.minAmount ? Number(filters.minAmount.replace(",", ".")) : null;
  const max = filters.maxAmount ? Number(filters.maxAmount.replace(",", ".")) : null;
  return ledgerExpenses(expenses).filter((expense) => {
    if (query) {
      const category = lookup.categories.find((item) => item.id === expense.categoryId);
      const method = lookup.methods.find((item) => item.id === expense.methodId);
      const hay = [
        expense.place,
        expense.note,
        category?.name ?? "",
        method?.name ?? "",
        method?.code ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      if (!hay.includes(query)) return false;
    }
    if (!inDateFilter(expense.occurredAt, filters.date, Date.now(), filters.customFrom, filters.customTo)) {
      return false;
    }
    if (filters.categoryId && expense.categoryId !== filters.categoryId) return false;
    if (filters.methodId && expense.methodId !== filters.methodId) return false;
    if (filters.spendClass && expense.spendClass !== filters.spendClass) return false;
    if (filters.place && !expense.place.toLocaleLowerCase("tr-TR").includes(filters.place.toLocaleLowerCase("tr-TR"))) {
      return false;
    }
    if (min != null && Number.isFinite(min) && expense.amount < min) return false;
    if (max != null && Number.isFinite(max) && expense.amount > max) return false;
    return true;
  });
}

export function monthTotal(expenses: Expense[], now = Date.now()) {
  return ledgerExpenses(expenses)
    .filter((expense) => inDateFilter(expense.occurredAt, "this-month", now))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function todayTotal(expenses: Expense[], now = Date.now()) {
  return ledgerExpenses(expenses)
    .filter((expense) => inDateFilter(expense.occurredAt, "today", now))
    .reduce((sum, expense) => sum + expense.amount, 0);
}
