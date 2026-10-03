"use client";

import { UNSPECIFIED_SOURCE_LABEL } from "@/lib/domain";
import { formatClock, istanbulParts, startOfIstanbulDay } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { AmountText } from "./AmountText";
import { BankLogo } from "./BankLogo";
import { CategoryMark } from "./category-icon";
import { useExpenseSheet } from "./ExpenseSheetContext";
import { useStore } from "@/lib/store";

function whenLabel(ts: number, now = Date.now()) {
  const day = startOfIstanbulDay(ts);
  const today = startOfIstanbulDay(now);
  const diff = Math.round((today - day) / 86_400_000);
  const clock = formatClock(ts);
  if (diff === 0) return `Bugün · ${clock}`;
  if (diff === 1) return `Dün · ${clock}`;
  const parts = istanbulParts(ts);
  return `${parts.day} ${new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "Europe/Istanbul" }).format(new Date(ts))} · ${clock}`;
}

export function ExpenseSlip({ expense }: { expense: Expense }) {
  const { state } = useStore();
  const { openDetail } = useExpenseSheet();
  const category = state.categories.find((item) => item.id === expense.categoryId);
  const source = state.paymentSources.find((item) => item.id === expense.paymentSourceId);
  const bank = source?.bankId ? state.banks.find((item) => item.id === source.bankId) : null;

  return (
    <button type="button" className="slip" onClick={() => openDetail(expense)}>
      <BankLogo bank={source?.type === "cash" ? null : bank} size="row" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold tracking-tight">
          {expense.place || category?.name || "Harcama"}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {category?.name ?? "Kategori"} · {source ? source.name : UNSPECIFIED_SOURCE_LABEL}
        </p>
        <p className="mt-0.5 text-[12px] text-ink-muted">{whenLabel(expense.occurredAt)}</p>
      </div>
      <AmountText kurus={expense.amountKurus} className="shrink-0 text-[16px] font-semibold tabular-nums" />
    </button>
  );
}

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { state } = useStore();
  const { openDetail } = useExpenseSheet();
  const category = state.categories.find((item) => item.id === expense.categoryId);
  const source = state.paymentSources.find((item) => item.id === expense.paymentSourceId);
  const bank = source?.bankId ? state.banks.find((item) => item.id === source.bankId) : null;
  return (
    <button
      type="button"
      onClick={() => openDetail(expense)}
      className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-70"
    >
      <CategoryMark name={category?.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold tracking-tight">
          {expense.place || category?.name || "Harcama"}
        </p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-[13px] text-ink-muted">
          <BankLogo bank={source?.type === "cash" ? null : bank} size="row" />
          {source ? source.name : UNSPECIFIED_SOURCE_LABEL}
        </p>
      </div>
      <AmountText kurus={expense.amountKurus} className="shrink-0 text-[16px] font-semibold tabular-nums" />
    </button>
  );
}
