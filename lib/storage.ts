import { inferLegacyClass } from "./classifier";
import { toExpenseDate } from "./format";
import { createSeedState, SEED_CATEGORIES } from "./seed";
import { LEDGER_KIND, type AppState, type MethodType, type PaymentMethod, type SpendClass } from "./types";

export const STORAGE_KEY = "harcama-defteri-v2";
const LEGACY_KEY = "harcama-defteri-v1";

function inferType(name: string): MethodType {
  const n = name.toLocaleLowerCase("tr-TR");
  if (n.includes("nakit")) return "cash";
  if (n.includes("kredi") || n.includes("kk")) return "credit";
  if (n.includes("hesap") || n.includes("banka") || n.includes("debit")) return "debit";
  return "cash";
}

function inferCode(name: string, fallbackIndex: number): string {
  const known: Record<string, string> = {
    nakit: "NKT",
    "enpara kk": "EPK",
    "enpara kredi kartı": "EPK",
    "enpara hesap": "EPH",
    "enpara banka hesabı": "EPH",
    "iş bankası kk": "ISK",
    "yapı kredi kk": "YKK",
  };
  const key = name.toLocaleLowerCase("tr-TR");
  if (known[key]) return known[key];
  const letters = name
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "")
    .slice(0, 3)
    .toLocaleUpperCase("tr-TR");
  return letters || `Y${fallbackIndex + 1}`;
}

function renameCategory(name: string) {
  if (name === "Yeme & İçme" || name === "Yemek") return "Yeme İçme";
  return name;
}

function asClass(value: unknown): SpendClass | null {
  if (value === "need" || value === "want" || value === "luxury") return value;
  return null;
}

export function migrateUnknown(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.categories) || !Array.isArray(data.methods) || !Array.isArray(data.expenses)) {
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

  const methods: PaymentMethod[] = (data.methods as Record<string, unknown>[]).map(
    (method, index) => {
      const name = String(method.name ?? "Yöntem");
      return {
        id: String(method.id ?? `m-${index}`),
        name,
        code: String(method.code ?? inferCode(name, index)).toLocaleUpperCase("tr-TR"),
        type: (method.type as MethodType) || inferType(name),
        lastUsedAt: Number(method.lastUsedAt) || 0,
      };
    },
  );

  const draft: AppState = {
    version: 4,
    categories,
    methods,
    expenses: [],
    classCorrections: [],
    settings: {
      currency: "TRY",
      theme: "system",
      aiEnabled: true,
      goals: { wantMaxPct: null, luxuryMaxPct: null },
    },
  };

  const expenses = (data.expenses as Record<string, unknown>[])
    .map((expense, index) => {
      const createdAt = Number(expense.createdAt) || Date.now();
      const kind = expense.kind === LEDGER_KIND ? LEDGER_KIND : LEDGER_KIND;
      if (expense.kind && expense.kind !== LEDGER_KIND) return null;
      const when = resolveWhen(expense, createdAt);
      const partial = {
        id: String(expense.id ?? `exp-${index}`),
        kind,
        place: String(expense.place ?? ""),
        amount: Number(expense.amount) || 0,
        categoryId: String(expense.categoryId ?? categories[0]?.id ?? ""),
        methodId: String(expense.methodId ?? methods[0]?.id ?? ""),
        occurredAt: when.occurredAt,
        expenseDate: when.expenseDate,
        createdAt,
        note: String(expense.note ?? ""),
        installmentCount:
          typeof expense.installmentCount === "number" && expense.installmentCount > 1
            ? expense.installmentCount
            : undefined,
      };
      const spendClass =
        asClass(expense.spendClass) ?? inferLegacyClass(partial, draft);
      return {
        ...partial,
        spendClass,
        aiSuggestedClass: asClass(expense.aiSuggestedClass) ?? undefined,
      };
    })
    .filter((expense): expense is NonNullable<typeof expense> => expense != null && expense.amount > 0);

  const settingsRaw = (data.settings as Record<string, unknown>) ?? {};
  const goalsRaw = (settingsRaw.goals as Record<string, unknown>) ?? {};
  return {
    version: 4,
    categories,
    methods,
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
      aiEnabled: settingsRaw.aiEnabled !== false,
      goals: {
        wantMaxPct: typeof goalsRaw.wantMaxPct === "number" ? goalsRaw.wantMaxPct : null,
        luxuryMaxPct: typeof goalsRaw.luxuryMaxPct === "number" ? goalsRaw.luxuryMaxPct : null,
      },
    },
  };
}

function resolveWhen(expense: Record<string, unknown>, createdAt: number) {
  const rawDate =
    typeof expense.expenseDate === "string"
      ? expense.expenseDate
      : typeof expense.date === "string"
        ? expense.date
        : "";
  if (rawDate) {
    const iso = rawDate.length === 10 ? `${rawDate}T12:00:00` : rawDate.slice(0, 19);
    const occurredAt = Date.parse(`${iso}+03:00`);
    if (Number.isFinite(occurredAt)) return { occurredAt, expenseDate: iso };
  }
  const occurredAt = Number(expense.occurredAt) || createdAt;
  return { occurredAt, expenseDate: toExpenseDate(occurredAt) };
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
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
  }).format(new Date(at));
}

async function maybeSnapshot(state: AppState, at: number) {
  try {
    const snaps = (await idbGet<Snapshot[]>(SNAP_KEY)) ?? readLocalSnaps();
    const day = toExpenseDate(at).slice(0, 10);
    if (snaps.some((snap) => toExpenseDate(snap.at).slice(0, 10) === day)) return;
    const next = [{ at, label: snapshotLabel(at), state }, ...snaps].slice(0, 4);
    window.localStorage.setItem(SNAP_KEY, JSON.stringify(next.map((snap) => ({ at: snap.at, label: snap.label }))));
    await idbSet(SNAP_KEY, next);
  } catch {
    /* snapshots are best-effort */
  }
}

function readLocalSnaps(): Snapshot[] {
  return [];
}

export async function listSnapshots(): Promise<Snapshot[]> {
  try {
    const snaps = await idbGet<Snapshot[]>(SNAP_KEY);
    return snaps ?? [];
  } catch {
    return [];
  }
}
