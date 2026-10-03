import { mergeCatalog, syncDerived } from "./domain";
import { migrateUnknown } from "./storage";
import type { AppState, Bank, Category, ClassCorrection, Expense, PaymentSource } from "./types";
import { APP_VERSION, BACKUP_VERSION, STATE_VERSION } from "./version";

export { APP_VERSION, BACKUP_VERSION };

export type BackupFile = {
  backupVersion: number;
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  data: AppState;
};

export type BackupResult =
  | { ok: true; state: AppState; createdAt: string }
  | { ok: false; error: string };

function hasCore(payload: Record<string, unknown>) {
  return (
    Array.isArray(payload.expenses) &&
    Array.isArray(payload.categories) &&
    (Array.isArray(payload.paymentSources) || Array.isArray(payload.methods)) &&
    payload.settings &&
    typeof payload.settings === "object"
  );
}

export function buildBackup(state: AppState, now = new Date()): BackupFile {
  const portable: AppState = syncDerived({
    ...state,
    banks: state.banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      searchNames: bank.searchNames,
      shortCode: bank.shortCode,
      logoKey: bank.logoKey,
      isManual: bank.isManual,
    })),
  });
  return {
    backupVersion: BACKUP_VERSION,
    schemaVersion: STATE_VERSION,
    createdAt: now.toISOString(),
    appVersion: APP_VERSION,
    data: portable,
  };
}

export function parseBackup(text: string): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "Bu yedek dosyası geçerli değil." };
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Bu yedek dosyası geçerli değil." };
  }
  const record = raw as Record<string, unknown>;
  const wrapped = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : null;
  const payload = wrapped ?? record;
  if (!hasCore(payload)) return { ok: false, error: "Bu yedek dosyası geçerli değil." };
  if (wrapped && typeof record.backupVersion !== "number") {
    return { ok: false, error: "Bu yedek dosyası geçerli değil." };
  }
  const state = migrateUnknown(payload);
  if (!state) return { ok: false, error: "Bu yedek dosyası geçerli değil." };
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
  return { ok: true, state, createdAt };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }
  return [...map.values()];
}

export function mergeStates(current: AppState, incoming: AppState): AppState {
  const corrections = new Map<string, ClassCorrection>();
  for (const row of [...current.classCorrections, ...incoming.classCorrections]) {
    corrections.set(`${row.place}|${row.categoryId}|${row.at}|${row.chosen}`, row);
  }
  return syncDerived({
    ...current,
    version: 5,
    categories: mergeById<Category>(current.categories, incoming.categories).map((item, index) => ({
      ...item,
      order: item.order ?? index,
    })),
    banks: mergeCatalog(mergeById<Bank>(current.banks, incoming.banks)),
    paymentSources: mergeById<PaymentSource>(current.paymentSources, incoming.paymentSources),
    expenses: mergeById<Expense>(current.expenses, incoming.expenses),
    classCorrections: [...corrections.values()].slice(0, 400),
    settings: {
      ...current.settings,
      ...incoming.settings,
      hideAmounts: incoming.settings.hideAmounts ?? current.settings.hideAmounts,
      goals: {
        wantMaxPct: incoming.settings.goals.wantMaxPct ?? current.settings.goals.wantMaxPct,
        luxuryMaxPct: incoming.settings.goals.luxuryMaxPct ?? current.settings.goals.luxuryMaxPct,
      },
    },
  });
}
