"use client";

import { BottomNav } from "./BottomNav";
import { ToastProvider } from "./Toast";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ToastProvider>
        <div className="mx-auto min-h-dvh w-full max-w-lg bg-canvas pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <BottomNav />
      </ToastProvider>
    </StoreProvider>
  );
}
