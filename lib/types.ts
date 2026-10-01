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

export type Category = {
  id: string;
  name: string;
  order: number;
};

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
  amount: number;
  categoryId: string;
  methodId: string;
  spendClass: SpendClass;
  aiSuggestedClass?: SpendClass;
  occurredAt: number;
  expenseDate: string;
  createdAt: number;
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
  aiEnabled: boolean;
  goals: {
    wantMaxPct: number | null;
    luxuryMaxPct: number | null;
  };
};

export type AppState = {
  version: 4;
  categories: Category[];
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
  methodId: string;
  place: string;
  spendClass: SpendClass | "";
  minAmount: string;
  maxAmount: string;
};

export type ExpenseDraft = {
  place: string;
  amount: number;
  categoryId: string;
  methodId: string;
  spendClass: SpendClass;
  aiSuggestedClass?: SpendClass;
  occurredAt: number;
  note: string;
  installmentCount?: number;
};
