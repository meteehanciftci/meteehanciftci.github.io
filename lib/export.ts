import { formatMoney, istanbulParts } from "./format";
import { CLASS_LABEL, LEDGER_KIND, type AppState, type Expense } from "./types";

export function ledgerExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => expense.kind === LEDGER_KIND);
}

export function exportCsv(state: AppState): string {
  const header = [
    "tarih",
    "saat",
    "yer",
    "tutar",
    "odeme",
    "sinif",
    "kategori",
    "not",
  ];
  const rows = ledgerExpenses(state.expenses).map((expense) => {
    const p = istanbulParts(expense.occurredAt);
    const category = state.categories.find((item) => item.id === expense.categoryId)?.name ?? "";
    const method = state.methods.find((item) => item.id === expense.methodId);
    const pad = (n: number) => String(n).padStart(2, "0");
    return [
      `${pad(p.day)}.${pad(p.month)}.${p.year}`,
      `${pad(p.hour)}:${pad(p.minute)}`,
      expense.place,
      String(expense.amount).replace(".", ","),
      method?.name ?? "",
      CLASS_LABEL[expense.spendClass],
      category,
      expense.note,
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(";");
  });
  return [header.join(";"), ...rows].join("\n");
}

export function backupJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function installmentLabel(expense: Expense, currency: AppState["settings"]["currency"]) {
  if (!expense.installmentCount || expense.installmentCount < 2) return null;
  const part = Math.round((expense.amount / expense.installmentCount) * 100) / 100;
  return `${expense.installmentCount} × ${formatMoney(part, currency)}`;
}
