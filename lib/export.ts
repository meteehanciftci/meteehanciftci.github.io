import { bankOfSource, ledgerExpenses, sourceOfExpense, UNSPECIFIED_SOURCE_LABEL } from "./domain";
import { istanbulParts } from "./format";
import { formatKurus } from "./money";
import type { AppState, Expense } from "./types";

export { ledgerExpenses };

function csvCell(value: string) {
  let text = value.replace(/\r\n/g, "\n");
  if (/^[=+\-@|]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCsv(state: AppState): string {
  const header = ["tarih", "kategori", "banka", "odeme_kaynagi", "tutar", "aciklama"];
  const rows = ledgerExpenses(state.expenses).map((expense) => {
    const p = istanbulParts(expense.occurredAt);
    const category = state.categories.find((item) => item.id === expense.categoryId)?.name ?? "";
    const source = sourceOfExpense(expense, state.paymentSources);
    const bank = bankOfSource(source ?? undefined, state.banks);
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = expense.occurredOn || `${p.year}-${pad(p.month)}-${pad(p.day)}`;
    const [year, month, dayNum] = day.split("-");
    return [
      `${dayNum}.${month}.${year}`,
      category,
      source?.type === "cash" ? "Nakit" : (bank?.name ?? ""),
      source?.name ?? UNSPECIFIED_SOURCE_LABEL,
      formatKurus(expense.amountKurus, state.settings.currency).replace(" ₺", "").replace(" €", "").replace(" $", ""),
      expense.place || expense.note,
    ].map((cell) => csvCell(cell));
  });
  return ["\uFEFF" + header.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
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
  const part = Math.trunc(expense.amountKurus / expense.installmentCount);
  return `${expense.installmentCount} × ${formatKurus(part, currency)}`;
}
