"use client";

import { useSyncExternalStore } from "react";
import { istanbulParts, shiftMonth } from "./format";

export type ViewMonth = { year: number; month: number; all: boolean };

const listeners = new Set<() => void>();
let current: ViewMonth | null = null;

function fresh(): ViewMonth {
  const now = istanbulParts();
  return { year: now.year, month: now.month, all: false };
}

function read(): ViewMonth {
  if (current) return current;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("harcama-view-month");
      if (raw) {
        const parsed = JSON.parse(raw) as ViewMonth;
        if (parsed.year && parsed.month) {
          current = { year: parsed.year, month: parsed.month, all: Boolean(parsed.all) };
          return current;
        }
      }
    } catch {
      /* ignore broken session value */
    }
  }
  current = fresh();
  return current;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getViewMonth() {
  return read();
}

export function setViewMonth(next: ViewMonth) {
  current = next;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("harcama-view-month", JSON.stringify(next));
  }
  emit();
}

export function shiftViewMonth(delta: number) {
  const view = read();
  const next = shiftMonth(view.year, view.month, delta);
  setViewMonth({ ...next, all: false });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverView = fresh();

export function useViewMonth() {
  return useSyncExternalStore(subscribe, getViewMonth, () => serverView);
}
