"use client";

import { formatMoney, formatRowWhen } from "@/lib/format";
import { installmentLabel } from "@/lib/export";
import type { Category, Expense, PaymentMethod } from "@/lib/types";
import { useExpenseSheet } from "./ExpenseSheetContext";
import { useStore } from "@/lib/store";

type Props = {
  expense: Expense;
  category?: Category;
  method?: PaymentMethod;
};

export function ExpenseRow({ expense, category, method }: Props) {
  const { openEdit } = useExpenseSheet();
  const { state } = useStore();
  const installments = installmentLabel(expense, state.settings.currency);

  return (
    <button
      type="button"
      onClick={() => openEdit(expense)}
      className="flex w-full items-start justify-between gap-4 py-3.5 text-left active:opacity-70"
    >
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold tracking-tight">{expense.place}</p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {category?.name ?? "Kategori"}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {method?.code ?? "—"} · {formatRowWhen(expense.occurredAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[16px] font-semibold tabular-nums tracking-tight">
          {formatMoney(expense.amount, state.settings.currency)}
        </p>
        {installments ? (
          <p className="mt-0.5 text-[12px] text-ink-muted">{installments}</p>
        ) : null}
      </div>
    </button>
  );
}
