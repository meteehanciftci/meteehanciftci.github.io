"use client";

import { BottomNav } from "./BottomNav";
import { ExpenseSheetHost } from "./ExpenseSheetHost";
import { ExpenseSheetProvider } from "./ExpenseSheetContext";
import { ThemeSync } from "./ThemeSync";
import { ToastProvider } from "./Toast";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeSync />
      <ToastProvider>
        <ExpenseSheetProvider>
          <div className="mx-auto min-h-dvh w-full max-w-lg bg-canvas pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
          <BottomNav />
          <ExpenseSheetHost />
        </ExpenseSheetProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
