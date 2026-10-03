export const LEDGER_KIND = "manual" as const;
export type LedgerKind = typeof LEDGER_KIND;

export type ExcludedKind =
  | "cc_payment"
  | "loan_payment"
  | "bill"
  | "transfer"
  | "adjustment"
  | "statement_import"
  | "pdf_import"
  | "opening_balance"
  | "limit_change"
  | "debt_fix"
  | "system";

export type MethodType = "credit" | "debit" | "cash";
export type PaymentSourceType = "cash" | "bank_account" | "credit_card" | "overdraft";
export type SpendClass = "need" | "want" | "luxury";
export type ThemePreference = "light" | "dark" | "system";
export type CurrencyCode = "TRY" | "EUR" | "USD";
export type Period =
  | "7d"
  | "30d"
  | "this-month"
  | "last-month"
  | "3m"
  | "6m"
  | "1y"
  | "all";

export const CLASS_LABEL: Record<SpendClass, string> = {
  need: "İhtiyaç",
  want: "İstek",
  luxury: "Lüks",
};

export const SOURCE_TYPE_LABEL: Record<PaymentSourceType, string> = {
  cash: "Nakit",
  bank_account: "Vadesiz hesap",
  credit_card: "Kredi kartı",
  overdraft: "Ek hesap",
};

export type Category = {
  id: string;
  name: string;
  order: number;
};

export type Bank = {
  id: string;
  name: string;
  searchNames: string[];
  shortCode?: string;
  logoKey: string;
  isManual: boolean;
};

export type PaymentSource = {
  id: string;
  bankId: string | null;
  name: string;
  type: PaymentSourceType;
  sortOrder: number;
  archived: boolean;
  isDefault: boolean;
  lastUsedAt: number;
};

/** Eski yedekler ve kullanılmayan analiz kodu için korunur. */
export type PaymentMethod = {
  id: string;
  name: string;
  code: string;
  type: MethodType;
  lastUsedAt: number;
};

export type Expense = {
  id: string;
  kind: LedgerKind;
  place: string;
  amountKurus: number;
  categoryId: string;
  paymentSourceId: string | null;
  spendClass: SpendClass;
  aiSuggestedClass?: SpendClass;
  occurredOn: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  note: string;
  installmentCount?: number;
};

export type ClassCorrection = {
  place: string;
  categoryId: string;
  chosen: SpendClass;
  suggested?: SpendClass;
  at: number;
};

export type Settings = {
  currency: CurrencyCode;
  theme: ThemePreference;
  hideAmounts: boolean;
  aiEnabled: boolean;
  goals: {
    wantMaxPct: number | null;
    luxuryMaxPct: number | null;
  };
};

export type AppState = {
  version: 5;
  categories: Category[];
  banks: Bank[];
  paymentSources: PaymentSource[];
  methods: PaymentMethod[];
  expenses: Expense[];
  settings: Settings;
  classCorrections: ClassCorrection[];
};

export type DateFilter =
  | "all"
  | "today"
  | "this-week"
  | "this-month"
  | "last-month"
  | "custom";

export type ExpenseFilters = {
  query: string;
  date: DateFilter;
  customFrom?: string;
  customTo?: string;
  categoryId: string;
  bankId: string;
  paymentSourceId: string;
  unspecifiedSource: boolean;
  methodId: string;
  place: string;
  spendClass: SpendClass | "";
  minAmount: string;
  maxAmount: string;
};

export type ExpenseDraft = {
  place: string;
  amountKurus: number;
  categoryId: string;
  paymentSourceId: string | null;
  spendClass: SpendClass;
  aiSuggestedClass?: SpendClass;
  occurredOn: string;
  occurredAt: number;
  note: string;
  installmentCount?: number;
};
