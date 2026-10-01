export type Category = {
  id: string;
  name: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  lastUsedAt: number;
};

export type Expense = {
  id: string;
  place: string;
  amount: number;
  categoryId: string;
  methodId: string;
  createdAt: number;
};

export type AppState = {
  categories: Category[];
  methods: PaymentMethod[];
  expenses: Expense[];
};

export type DateFilter = "all" | "this-month" | "last-month" | "this-year";

export type ExpenseFilters = {
  query: string;
  date: DateFilter;
  categoryId: string;
  methodId: string;
};
