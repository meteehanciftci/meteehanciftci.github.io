"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  addManualBank,
  addPaymentSource,
  archiveSource,
  changeExpenseSource,
  defaultSourceId,
  filterExpenses as filterLedger,
  ledgerExpenses,
  renameSource,
  reorderSource,
  setDefaultSource,
  sourceIsUsed,
  syncDerived,
} from "./domain";
import { isExpenseDay, toExpenseDay } from "./format";
import { createId } from "./ids";
import { createSeedState } from "./seed";
import { loadState, pullNewerFromIdb, saveState } from "./storage";
import { normalizeName } from "./text";
import {
  LEDGER_KIND,
  type AppState,
  type Bank,
  type Category,
  type Expense,
  type ExpenseDraft,
  type ExpenseFilters,
  type PaymentSource,
  type PaymentSourceType,
  type Settings,
} from "./types";

type StoreValue = {
  ready: boolean;
  state: AppState;
  ledger: Expense[];
  lastDeleted: Expense | null;
  addExpense: (input: ExpenseDraft) => Expense | null;
  updateExpense: (id: string, patch: Partial<ExpenseDraft>) => boolean;
  deleteExpense: (id: string) => Expense | null;
  undoDelete: () => boolean;
  addCategory: (name: string) => Category | null;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  addBank: (name: string) => Bank | null;
  addSource: (input: { bankId: string | null; name: string; type: PaymentSourceType }) => PaymentSource | null;
  renameSource: (id: string, name: string) => void;
  archiveSource: (id: string, archived: boolean) => void;
  setDefaultSource: (id: string) => void;
  reorderSource: (id: string, direction: -1 | 1) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importBackup: (state: AppState) => void;
  wipeAll: () => void;
  suggestionForPlace: (place: string) => { categoryId: string; paymentSourceId: string | null } | null;
  places: string[];
};

const StoreContext = createContext<StoreValue | null>(null);

const listeners = new Set<() => void>();
let memory: AppState | null = null;
let lastDeleted: Expense | null = null;
let lastSubmitKey = "";
let lastSubmitAt = 0;

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

function draftKey(input: ExpenseDraft) {
  return [
    input.amountKurus,
    input.categoryId,
    input.paymentSourceId ?? "",
    input.occurredOn,
    normalizeName(input.place),
    input.note.trim(),
  ].join("|");
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeIsClient, () => true, () => false);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<StoreValue>(() => {
    const addExpense: StoreValue["addExpense"] = (input) => {
      if (input.amountKurus <= 0 || !input.categoryId) return null;
      if (input.paymentSourceId && !state.paymentSources.some((source) => source.id === input.paymentSourceId)) {
        return null;
      }
      const key = draftKey(input);
      const now = Date.now();
      if (key === lastSubmitKey && now - lastSubmitAt < 1200) return null;
      lastSubmitKey = key;
      lastSubmitAt = now;
      const occurredOn = isExpenseDay(input.occurredOn) ? input.occurredOn : toExpenseDay(input.occurredAt);
      const expense: Expense = {
        id: createId(),
        kind: LEDGER_KIND,
        place: normalizeName(input.place),
        amountKurus: input.amountKurus,
        categoryId: input.categoryId,
        paymentSourceId: input.paymentSourceId,
        spendClass: input.spendClass ?? "need",
        aiSuggestedClass: input.aiSuggestedClass,
        occurredOn,
        occurredAt: input.occurredAt,
        createdAt: now,
        updatedAt: now,
        note: input.note.trim(),
        installmentCount:
          input.installmentCount && input.installmentCount > 1 ? input.installmentCount : undefined,
      };
      commit({
        ...state,
        expenses: [expense, ...state.expenses],
        classCorrections: rememberCorrection(state, expense),
        paymentSources: state.paymentSources.map((source) =>
          source.id === expense.paymentSourceId ? { ...source, lastUsedAt: now } : source,
        ),
      });
      return expense;
    };

    const updateExpense: StoreValue["updateExpense"] = (id, patch) => {
      const existing = state.expenses.find((item) => item.id === id);
      if (!existing || existing.kind !== LEDGER_KIND) return false;
      const occurredOn = patch.occurredOn && isExpenseDay(patch.occurredOn) ? patch.occurredOn : existing.occurredOn;
      const nextExpense: Expense = {
        ...existing,
        ...patch,
        kind: LEDGER_KIND,
        place: patch.place != null ? normalizeName(patch.place) : existing.place,
        note: patch.note != null ? patch.note.trim() : existing.note,
        occurredOn,
        occurredAt: patch.occurredAt ?? existing.occurredAt,
        updatedAt: Date.now(),
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
        paymentSources: state.paymentSources.map((source) =>
          source.id === nextExpense.paymentSourceId ? { ...source, lastUsedAt: Date.now() } : source,
        ),
      });
      return true;
    };

    const deleteExpense: StoreValue["deleteExpense"] = (id) => {
      const existing = state.expenses.find((item) => item.id === id);
      if (!existing) return null;
      lastDeleted = existing;
      commit({
        ...state,
        expenses: state.expenses.filter((item) => item.id !== id),
      });
      return existing;
    };

    const undoDelete: StoreValue["undoDelete"] = () => {
      if (!lastDeleted) return false;
      if (state.expenses.some((item) => item.id === lastDeleted?.id)) return false;
      const restored = lastDeleted;
      lastDeleted = null;
      commit({ ...state, expenses: [restored, ...state.expenses] });
      return true;
    };

    const addCategory: StoreValue["addCategory"] = (name) => {
      const clean = normalizeName(name);
      if (!clean) return null;
      if (state.categories.some((category) => category.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR"))) {
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

    const addBank: StoreValue["addBank"] = (name) => {
      const result = addManualBank(state, name, `bank-manual-${createId()}`);
      if (!result) return null;
      commit(result.state);
      return result.bank;
    };

    const addSource: StoreValue["addSource"] = (input) => {
      const result = addPaymentSource(state, { ...input, id: createId() });
      if (!result) return null;
      commit(result.state);
      return result.source;
    };

    const importBackup: StoreValue["importBackup"] = (next) => {
      lastDeleted = null;
      commit(syncDerived(next));
    };

    const wipeAll: StoreValue["wipeAll"] = () => {
      lastDeleted = null;
      commit(createSeedState());
    };

    const suggestionForPlace: StoreValue["suggestionForPlace"] = (place) => {
      const needle = normalizeName(place).toLocaleLowerCase("tr-TR");
      if (!needle) return null;
      const match = ledgerExpenses(state.expenses).find(
        (expense) => expense.place.toLocaleLowerCase("tr-TR") === needle,
      );
      if (!match) return null;
      return { categoryId: match.categoryId, paymentSourceId: match.paymentSourceId };
    };

    const ledger = ledgerExpenses(state.expenses);
    const places = Array.from(new Set(ledger.map((expense) => expense.place).filter(Boolean)));

    return {
      ready: true,
      state,
      ledger,
      lastDeleted,
      addExpense,
      updateExpense,
      deleteExpense,
      undoDelete,
      addCategory,
      updateCategory,
      deleteCategory,
      moveCategory,
      addBank,
      addSource,
      renameSource: (id, name) => commit(renameSource(state, id, name)),
      archiveSource: (id, archived) => commit(archiveSource(state, id, archived)),
      setDefaultSource: (id) => commit(setDefaultSource(state, id)),
      reorderSource: (id, direction) => commit(reorderSource(state, id, direction)),
      updateSettings: (patch) => commit({ ...state, settings: { ...state.settings, ...patch } }),
      importBackup,
      wipeAll,
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

export function useSortedCategories() {
  const { state } = useStore();
  return [...state.categories].sort((a, b) => a.order - b.order);
}

export function useSortedSources(currentId?: string | null) {
  const { state } = useStore();
  return [...state.paymentSources]
    .filter((source) => !source.archived || source.id === currentId)
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.lastUsedAt - a.lastUsedAt;
    });
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
  lookup: AppState,
) {
  return filterLedger(expenses, filters, lookup);
}

export function monthTotal(expenses: Expense[], now = Date.now()) {
  const day = toExpenseDay(now);
  const [year, month] = day.split("-").map(Number);
  return ledgerExpenses(expenses)
    .filter((expense) => expense.occurredOn.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .reduce((sum, expense) => sum + expense.amountKurus, 0);
}

export { defaultSourceId, sourceIsUsed, changeExpenseSource };
