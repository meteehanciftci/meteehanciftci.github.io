"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Expense } from "@/lib/types";

type SheetApi = {
  editing: Expense | null;
  addOpen: boolean;
  openedAt: number;
  openAdd: () => void;
  openEdit: (expense: Expense) => void;
  close: () => void;
};

const SheetContext = createContext<SheetApi | null>(null);

export function ExpenseSheetProvider({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [openedAt, setOpenedAt] = useState(0);

  const openAdd = useCallback(() => {
    setEditing(null);
    setOpenedAt(Date.now());
    setAddOpen(true);
  }, []);
  const openEdit = useCallback((expense: Expense) => {
    setEditing(expense);
    setAddOpen(true);
  }, []);
  const close = useCallback(() => {
    setAddOpen(false);
    setEditing(null);
  }, []);

  const value = useMemo(
    () => ({ editing, addOpen, openedAt, openAdd, openEdit, close }),
    [editing, addOpen, openedAt, openAdd, openEdit, close],
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useExpenseSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useExpenseSheet provider dışında");
  return ctx;
}
