"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastContextValue = {
  message: string | null;
  actionLabel: string | null;
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const actionRef = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback((next: string, options?: ToastOptions) => {
    setMessage(next);
    setActionLabel(options?.actionLabel ?? null);
    actionRef.current = options?.onAction ?? null;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setMessage((current) => (current === next ? null : current));
      setActionLabel(null);
      actionRef.current = null;
    }, options?.duration ?? 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ message, actionLabel, showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`fixed inset-x-0 z-[80] flex justify-center px-4 transition-all duration-200 ${
          message ? "bottom-24 opacity-100" : "pointer-events-none bottom-20 opacity-0"
        }`}
      >
        {message ? (
          <p className="flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            <span>{message}</span>
            {actionLabel ? (
              <button
                type="button"
                className="underline decoration-white/40 underline-offset-2"
                onClick={() => {
                  actionRef.current?.();
                  setMessage(null);
                  setActionLabel(null);
                }}
              >
                {actionLabel}
              </button>
            ) : null}
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
