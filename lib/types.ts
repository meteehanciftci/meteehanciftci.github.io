export const LEDGER_KIND = "manual" as const;
export type LedgerKind = typeof LEDGER_KIND;

/** Records that must never appear in Harcama Defteri. */
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

export type ThemePreference = "light" | "dark" | "system";
export type CurrencyCode = "TRY" | "EUR" | "USD";

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
  occurredAt: number;
  createdAt: number;
  note: string;
  installmentCount?: number;
};

export type Settings = {
  currency: CurrencyCode;
  theme: ThemePreference;
};

export type AppState = {
  version: 2;
  categories: Category[];
  methods: PaymentMethod[];
  expenses: Expense[];
  settings: Settings;
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
  minAmount: string;
  maxAmount: string;
};

export type ExpenseDraft = {
  place: string;
  amount: number;
  categoryId: string;
  methodId: string;
  occurredAt: number;
  note: string;
  installmentCount?: number;
};
