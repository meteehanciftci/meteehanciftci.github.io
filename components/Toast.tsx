"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastContextValue = {
  message: string | null;
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    window.setTimeout(() => {
      setMessage((current) => (current === next ? null : current));
    }, 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ message, showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 transition-all duration-200 ${
          message ? "bottom-24 opacity-100" : "bottom-20 opacity-0"
        }`}
      >
        {message ? (
          <p className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            {message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ToastProvider içinde kullanılmalı");
  return ctx;
}
