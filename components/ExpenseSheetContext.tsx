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

type Mode = "closed" | "add" | "edit" | "detail";

type SheetApi = {
  editing: Expense | null;
  detail: Expense | null;
  addOpen: boolean;
  openedAt: number;
  openAdd: () => void;
  openEdit: (expense: Expense) => void;
  openDetail: (expense: Expense) => void;
  close: () => void;
};

const SheetContext = createContext<SheetApi | null>(null);

export function ExpenseSheetProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("closed");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);
  const [openedAt, setOpenedAt] = useState(0);

  const openAdd = useCallback(() => {
    setEditing(null);
    setDetail(null);
    setOpenedAt(Date.now());
    setMode("add");
  }, []);
  const openEdit = useCallback((expense: Expense) => {
    setEditing(expense);
    setDetail(null);
    setMode("edit");
  }, []);
  const openDetail = useCallback((expense: Expense) => {
    setDetail(expense);
    setEditing(null);
    setMode("detail");
  }, []);
  const close = useCallback(() => {
    setMode("closed");
    setEditing(null);
    setDetail(null);
  }, []);

  const value = useMemo(
    () => ({
      editing,
      detail,
      addOpen: mode === "add" || mode === "edit",
      openedAt,
      openAdd,
      openEdit,
      openDetail,
      close,
    }),
    [editing, detail, mode, openedAt, openAdd, openEdit, openDetail, close],
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useExpenseSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useExpenseSheet provider dışında");
  return ctx;
}
