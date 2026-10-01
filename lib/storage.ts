import { inferLegacyClass } from "./classifier";
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

function migrateUnknown(raw: unknown): AppState | null {
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
    version: 3,
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
      const partial = {
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
    version: 3,
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
