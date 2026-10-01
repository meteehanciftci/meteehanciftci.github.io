"use client";

import { useEffect } from "react";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";

export default function AddPage() {
  const { openAdd, close, addOpen } = useExpenseSheet();
  useEffect(() => {
    openAdd();
    return () => close();
  }, [openAdd, close]);

  if (addOpen) return null;
  return (
    <main className="px-5 pt-10 text-sm text-ink-muted">Harcama ekleniyor…</main>
  );
}
