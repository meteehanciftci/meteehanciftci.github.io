import {
  mergeCatalog,
  migrateLegacyMethods,
  resolveAmountKurus,
  resolveOccurredOn,
  syncDerived,
} from "./domain";
import { istanbulParts, toExpenseDay } from "./format";
import { createSeedState, SEED_CATEGORIES } from "./seed";
import { LEDGER_KIND, type AppState, type Expense, type PaymentSource, type SpendClass } from "./types";

export const STORAGE_KEY = "harcama-defteri-v2";
const LEGACY_KEY = "harcama-defteri-v1";

function renameCategory(name: string) {
  if (name === "Yeme & İçme" || name === "Yemek") return "Yeme İçme";
  return name;
}

function asClass(value: unknown): SpendClass | null {
  if (value === "need" || value === "want" || value === "luxury") return value;
  return null;
}

function resolveWhen(expense: Record<string, unknown>, createdAt: number) {
  if (Number.isFinite(Number(expense.occurredAt)) && Number(expense.occurredAt) > 0) {
    return Number(expense.occurredAt);
  }
  const rawDate =
    typeof expense.expenseDate === "string"
      ? expense.expenseDate
      : typeof expense.date === "string"
        ? expense.date
        : typeof expense.occurredOn === "string"
          ? expense.occurredOn
          : "";
  if (rawDate) {
    const day = rawDate.length >= 10 ? rawDate.slice(0, 10) : rawDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const occurredAt = Date.parse(`${day}T12:00:00+03:00`);
      if (Number.isFinite(occurredAt)) return occurredAt;
    }
    const iso = rawDate.length === 10 ? `${rawDate}T12:00:00` : rawDate.slice(0, 19);
    const occurredAt = Date.parse(`${iso}+03:00`);
    if (Number.isFinite(occurredAt)) return occurredAt;
  }
  return createdAt;
}

function knownSourceId(id: string | null, sources: PaymentSource[]) {
  if (!id) return null;
  return sources.some((source) => source.id === id) ? id : null;
}

export function migrateUnknown(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const rawSources = Array.isArray(data.paymentSources)
    ? (data.paymentSources as Record<string, unknown>[])
    : Array.isArray(data.methods)
      ? (data.methods as Record<string, unknown>[])
      : null;
  if (!Array.isArray(data.categories) || !rawSources || !Array.isArray(data.expenses)) {
    return null;
  }

  const categories = (data.categories as Record<string, unknown>[]).map((category, index) => ({
    id: String(category.id ?? `cat-${index}`),
    name: renameCategory(String(category.name ?? "Diğer")),
    order: typeof category.order === "number" ? category.order : index,
  }));

  const have = new Set(categories.map((category) => category.name.toLocaleLowerCase("tr-TR")));
  for (const seed of SEED_CATEGORIES) {
    if (!have.has(seed.name.toLocaleLowerCase("tr-TR"))) {
      categories.push({ ...seed, order: categories.length });
    }
  }

  const rawBanks = Array.isArray(data.banks) ? (data.banks as Record<string, unknown>[]) : [];
  const banks = mergeCatalog(
    rawBanks.map((bank, index) => ({
      id: String(bank.id ?? `bank-${index}`),
      name: String(bank.name ?? "Banka"),
      searchNames: Array.isArray(bank.searchNames)
        ? bank.searchNames.map((name) => String(name))
        : [String(bank.name ?? "")],
      shortCode: typeof bank.shortCode === "string" ? bank.shortCode : undefined,
      logoKey: String(bank.logoKey ?? "manual"),
      isManual: bank.isManual === true,
    })),
  );

  const knownBankIds = new Set(banks.map((bank) => bank.id));
  const paymentSources = migrateLegacyMethods(rawSources).map((source) => ({
    ...source,
    bankId: source.type === "cash" ? null : source.bankId && knownBankIds.has(source.bankId) ? source.bankId : source.bankId,
  }));

  if (paymentSources.length > 0 && !paymentSources.some((source) => source.isDefault && !source.archived)) {
    const firstActive = paymentSources.find((source) => !source.archived);
    if (firstActive) firstActive.isDefault = true;
  }

  const expenses = (data.expenses as Record<string, unknown>[])
    .map((expense, index): Expense | null => {
      if (expense.kind && expense.kind !== LEDGER_KIND) return null;
      const createdAt = Number(expense.createdAt) || Date.now();
      const occurredAt = resolveWhen(expense, createdAt);
      const amountKurus = resolveAmountKurus(expense);
      if (amountKurus <= 0) return null;
      const rawSource =
        typeof expense.paymentSourceId === "string"
          ? expense.paymentSourceId
          : typeof expense.methodId === "string"
            ? expense.methodId
            : "";
      const paymentSourceId = knownSourceId(rawSource || null, paymentSources);
      const partial = {
        id: String(expense.id ?? `exp-${index}`),
        kind: LEDGER_KIND,
        place: String(expense.place ?? ""),
        amountKurus,
        categoryId: String(expense.categoryId ?? categories[0]?.id ?? ""),
        paymentSourceId,
        occurredOn: resolveOccurredOn(expense, occurredAt),
        occurredAt,
        createdAt,
        updatedAt: Number(expense.updatedAt) || createdAt,
        note: String(expense.note ?? ""),
        installmentCount:
          typeof expense.installmentCount === "number" && expense.installmentCount > 1
            ? expense.installmentCount
            : undefined,
      };
      return {
        ...partial,
        spendClass: asClass(expense.spendClass) ?? "need",
        aiSuggestedClass: asClass(expense.aiSuggestedClass) ?? undefined,
      };
    })
    .filter((expense): expense is Expense => expense != null);

  const settingsRaw = (data.settings as Record<string, unknown>) ?? {};
  const goalsRaw = (settingsRaw.goals as Record<string, unknown>) ?? {};
  return syncDerived({
    version: 5,
    categories,
    banks: mergeCatalog(banks),
    paymentSources,
    expenses,
    classCorrections: Array.isArray(data.classCorrections)
      ? (data.classCorrections as Record<string, unknown>[]).map((row) => ({
          place: String(row.place ?? ""),
          categoryId: String(row.categoryId ?? ""),
          chosen: asClass(row.chosen) ?? "want",
          suggested: asClass(row.suggested) ?? undefined,
          at: Number(row.at) || Date.now(),
        }))
      : [],
    settings: {
      currency: settingsRaw.currency === "EUR" || settingsRaw.currency === "USD" ? settingsRaw.currency : "TRY",
      theme:
        settingsRaw.theme === "light" || settingsRaw.theme === "dark" || settingsRaw.theme === "system"
          ? settingsRaw.theme
          : "system",
      hideAmounts: settingsRaw.hideAmounts === true,
      aiEnabled: settingsRaw.aiEnabled === true,
      goals: {
        wantMaxPct: typeof goalsRaw.wantMaxPct === "number" ? goalsRaw.wantMaxPct : null,
        luxuryMaxPct: typeof goalsRaw.luxuryMaxPct === "number" ? goalsRaw.luxuryMaxPct : null,
      },
    },
  });
}

export const META_KEY = "harcama-defteri-meta";
const SNAP_KEY = "harcama-snapshots";

export type PersistedEnvelope = { savedAt: number; state: AppState };
export type Snapshot = { at: number; label: string; state: AppState };

let savedAtMemory = 0;

export function currentSavedAt() {
  return savedAtMemory;
}

function readMeta(): number {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    const parsed = raw ? (JSON.parse(raw) as { savedAt?: number }) : null;
    return Number(parsed?.savedAt) || 0;
  } catch {
    return 0;
  }
}

function writeMeta(savedAt: number) {
  window.localStorage.setItem(META_KEY, JSON.stringify({ savedAt }));
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      const seeded = createSeedState();
      savedAtMemory = Date.now();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      writeMeta(savedAtMemory);
      void persistEnvelope({ savedAt: savedAtMemory, state: seeded });
      return seeded;
    }
    const migrated = migrateUnknown(JSON.parse(raw));
    if (!migrated) return createSeedState();
    savedAtMemory = readMeta() || 1;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState) {
  const savedAt = Date.now();
  savedAtMemory = savedAt;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  writeMeta(savedAt);
  void persistEnvelope({ savedAt, state });
  void maybeSnapshot(state, savedAt);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("harcama-defteri", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet<T>(key: string): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readonly");
        const request = tx.objectStore("kv").get(key);
        request.onsuccess = () => resolve((request.result as T) ?? null);
        request.onerror = () => reject(request.error);
      }),
  );
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

async function persistEnvelope(envelope: PersistedEnvelope) {
  try {
    await idbSet("main", envelope);
  } catch {
    /* localStorage already holds the ledger */
  }
}

export async function pullNewerFromIdb(): Promise<AppState | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const envelope = await idbGet<PersistedEnvelope>("main");
    if (!envelope?.state || envelope.savedAt <= savedAtMemory) return null;
    const migrated = migrateUnknown(envelope.state);
    if (!migrated) return null;
    savedAtMemory = envelope.savedAt;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    writeMeta(envelope.savedAt);
    return migrated;
  } catch {
    return null;
  }
}

function snapshotLabel(at: number) {
  const parts = istanbulParts(at);
  const now = istanbulParts();
  const time = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  if (parts.year === now.year && parts.month === now.month && parts.day === now.day) {
    return `Bugün · ${time}`;
  }
  const day = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
  }).format(new Date(at));
  return `${day} · ${time}`;
}

function readLocalSnaps(): Snapshot[] {
  try {
    const raw = window.localStorage.getItem(SNAP_KEY);
    const parsed = raw ? (JSON.parse(raw) as Snapshot[]) : [];
    return Array.isArray(parsed) ? parsed.filter((snap) => snap?.state && snap.at) : [];
  } catch {
    return [];
  }
}

async function maybeSnapshot(state: AppState, at: number) {
  try {
    const snaps = (await idbGet<Snapshot[]>(SNAP_KEY)) ?? readLocalSnaps();
    const last = snaps[0];
    if (last && JSON.stringify(last.state.expenses) === JSON.stringify(state.expenses) && last.state.categories.length === state.categories.length) {
      return;
    }
    const next = [{ at, label: snapshotLabel(at), state }, ...snaps].slice(0, 8);
    window.localStorage.setItem(SNAP_KEY, JSON.stringify(next));
    await idbSet(SNAP_KEY, next);
  } catch {
    /* snapshots are best-effort */
  }
}

export async function listSnapshots(): Promise<Snapshot[]> {
  try {
    const snaps = await idbGet<Snapshot[]>(SNAP_KEY);
    if (snaps?.length) return snaps;
  } catch {
    /* fall through */
  }
  return readLocalSnaps();
}

export async function saveFileBackup(name: string, text: string) {
  const record = { name, text, at: Date.now() };
  window.localStorage.setItem("harcama-file-backup", JSON.stringify(record));
  await idbSet("file-backup", record);
  return record;
}

export async function readFileBackup(): Promise<{ name: string; text: string; at: number } | null> {
  try {
    const fromIdb = await idbGet<{ name: string; text: string; at: number }>("file-backup");
    if (fromIdb?.text) return fromIdb;
  } catch {
    /* local copy next */
  }
  try {
    const raw = window.localStorage.getItem("harcama-file-backup");
    return raw ? (JSON.parse(raw) as { name: string; text: string; at: number }) : null;
  } catch {
    return null;
  }
}

export { toExpenseDay };
