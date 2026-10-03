"use client";

import { AppNav } from "./AppNav";
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
          <AppNav />
          <div className="mx-auto min-h-dvh w-full bg-canvas pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:ml-52 md:max-w-none md:pb-8">
            {children}
          </div>
          <ExpenseSheetHost />
        </ExpenseSheetProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
