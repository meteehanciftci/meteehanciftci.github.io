import { createSeedState } from "./seed";
import type { AppState } from "./types";

export const STORAGE_KEY = "harcama-defteri-v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as AppState;
    if (
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.methods) ||
      !Array.isArray(parsed.expenses)
    ) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
