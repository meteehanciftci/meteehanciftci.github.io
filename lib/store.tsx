"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { inDateFilter } from "./format";
import { createId } from "./ids";
import { createSeedState } from "./seed";
import { loadState, saveState } from "./storage";
import type {
  AppState,
  Category,
  Expense,
  ExpenseFilters,
  PaymentMethod,
} from "./types";

type StoreValue = {
  ready: boolean;
  state: AppState;
  addExpense: (
    input: Omit<Expense, "id" | "createdAt"> & { createdAt?: number },
  ) => Expense;
  updateExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (name: string) => Category | null;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addMethod: (name: string) => PaymentMethod | null;
  updateMethod: (id: string, name: string) => void;
  deleteMethod: (id: string) => void;
  suggestionForPlace: (place: string) => {
    categoryId: string;
    methodId: string;
  } | null;
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
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!memory) memory = loadState();
  return memory;
}

function getServerSnapshot(): AppState {
  return createSeedState();
}

function commit(next: AppState) {
  memory = next;
  saveState(next);
  emit();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<StoreValue>(() => {
    const addExpense: StoreValue["addExpense"] = (input) => {
      const expense: Expense = {
        id: createId(),
        place: normalizeName(input.place),
        amount: input.amount,
        categoryId: input.categoryId,
        methodId: input.methodId,
        createdAt: input.createdAt ?? Date.now(),
      };
      commit({
        ...state,
        expenses: [expense, ...state.expenses],
        methods: state.methods.map((method) =>
          method.id === expense.methodId
            ? { ...method, lastUsedAt: expense.createdAt }
            : method,
        ),
      });
      return expense;
    };

    const updateExpense: StoreValue["updateExpense"] = (id, patch) => {
      const existing = state.expenses.find((item) => item.id === id);
      if (!existing) return;
      const nextExpense: Expense = {
        ...existing,
        ...patch,
        place: patch.place ? normalizeName(patch.place) : existing.place,
      };
      commit({
        ...state,
        expenses: state.expenses.map((item) =>
          item.id === id ? nextExpense : item,
        ),
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
            category.name.toLocaleLowerCase("tr-TR") ===
            clean.toLocaleLowerCase("tr-TR"),
        )
      ) {
        return null;
      }
      const category = { id: createId(), name: clean };
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
          expense.categoryId === id
            ? { ...expense, categoryId: fallback }
            : expense,
        ),
      });
    };

    const addMethod: StoreValue["addMethod"] = (name) => {
      const clean = normalizeName(name);
      if (!clean) return null;
      if (
        state.methods.some(
          (method) =>
            method.name.toLocaleLowerCase("tr-TR") ===
            clean.toLocaleLowerCase("tr-TR"),
        )
      ) {
        return null;
      }
      const method = { id: createId(), name: clean, lastUsedAt: Date.now() };
      commit({ ...state, methods: [...state.methods, method] });
      return method;
    };

    const updateMethod: StoreValue["updateMethod"] = (id, name) => {
      const clean = normalizeName(name);
      if (!clean) return;
      commit({
        ...state,
        methods: state.methods.map((method) =>
          method.id === id ? { ...method, name: clean } : method,
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

    const suggestionForPlace: StoreValue["suggestionForPlace"] = (place) => {
      const needle = normalizeName(place).toLocaleLowerCase("tr-TR");
      if (!needle) return null;
      const match = state.expenses.find(
        (expense) => expense.place.toLocaleLowerCase("tr-TR") === needle,
      );
      if (!match) return null;
      return { categoryId: match.categoryId, methodId: match.methodId };
    };

    const places = Array.from(
      new Set(state.expenses.map((expense) => expense.place)),
    );

    return {
      ready: true,
      state,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      addMethod,
      updateMethod,
      deleteMethod,
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

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters) {
  const query = filters.query.trim().toLocaleLowerCase("tr-TR");
  return expenses.filter((expense) => {
    if (query && !expense.place.toLocaleLowerCase("tr-TR").includes(query)) {
      return false;
    }
    if (!inDateFilter(expense.createdAt, filters.date)) return false;
    if (filters.categoryId && expense.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.methodId && expense.methodId !== filters.methodId) {
      return false;
    }
    return true;
  });
}

export function monthTotal(expenses: Expense[], now = Date.now()) {
  return expenses
    .filter((expense) => inDateFilter(expense.createdAt, "this-month", now))
    .reduce((sum, expense) => sum + expense.amount, 0);
}
