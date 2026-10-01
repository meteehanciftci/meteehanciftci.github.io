import { createSeedState, SEED_CATEGORIES } from "./seed";
import { LEDGER_KIND, type AppState, type MethodType, type PaymentMethod } from "./types";

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

function migrateUnknown(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.categories) || !Array.isArray(data.methods) || !Array.isArray(data.expenses)) {
    return null;
  }

  const categories = (data.categories as Record<string, unknown>[]).map((category, index) => ({
    id: String(category.id ?? `cat-${index}`),
    name:
      String(category.name ?? "Diğer") === "Yeme & İçme"
        ? "Yemek"
        : String(category.name ?? "Diğer"),
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

  const expenses = (data.expenses as Record<string, unknown>[])
    .map((expense, index) => {
      const createdAt = Number(expense.createdAt) || Date.now();
      const kind = expense.kind === LEDGER_KIND ? LEDGER_KIND : LEDGER_KIND;
      if (expense.kind && expense.kind !== LEDGER_KIND) return null;
      return {
        id: String(expense.id ?? `exp-${index}`),
        kind,
        place: String(expense.place ?? ""),
        amount: Number(expense.amount) || 0,
        categoryId: String(expense.categoryId ?? categories[0]?.id ?? ""),
        methodId: String(expense.methodId ?? methods[0]?.id ?? ""),
        occurredAt: Number(expense.occurredAt) || createdAt,
        createdAt,
        note: String(expense.note ?? ""),
        installmentCount:
          typeof expense.installmentCount === "number" && expense.installmentCount > 1
            ? expense.installmentCount
            : undefined,
      };
    })
    .filter((expense): expense is NonNullable<typeof expense> => expense != null && expense.amount > 0);

  const settingsRaw = (data.settings as Record<string, unknown>) ?? {};
  return {
    version: 2,
    categories,
    methods,
    expenses,
    settings: {
      currency: settingsRaw.currency === "EUR" || settingsRaw.currency === "USD" ? settingsRaw.currency : "TRY",
      theme:
        settingsRaw.theme === "light" || settingsRaw.theme === "dark" || settingsRaw.theme === "system"
          ? settingsRaw.theme
          : "system",
    },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      const seeded = createSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const migrated = migrateUnknown(JSON.parse(raw));
    if (!migrated) return createSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
