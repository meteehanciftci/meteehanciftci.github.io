"use client";

import { useRef, useState } from "react";
import { formatClock, formatMoney, istanbulParts, startOfIstanbulDay } from "@/lib/format";
import { CLASS_LABEL, type Expense } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
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
  const { state, deleteExpense } = useStore();
  const { openDetail, openEdit } = useExpenseSheet();
  const category = state.categories.find((item) => item.id === expense.categoryId);
  const method = state.methods.find((item) => item.id === expense.methodId);
  const startX = useRef(0);
  const dx = useRef(0);
  const [confirm, setConfirm] = useState(false);

  return (
    <>
    <button
      type="button"
      className="slip"
      onClick={() => {
        if (Math.abs(dx.current) < 12) openDetail(expense);
      }}
      onPointerDown={(event) => {
        startX.current = event.clientX;
        dx.current = 0;
      }}
      onPointerUp={(event) => {
        dx.current = event.clientX - startX.current;
        if (dx.current < -72) setConfirm(true);
        else if (dx.current > 72) openEdit(expense);
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold tracking-tight">{expense.place}</p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {category?.name ?? "Kategori"} · {CLASS_LABEL[expense.spendClass]}
        </p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          {method?.code ?? "—"} · {whenLabel(expense.occurredAt)}
        </p>
      </div>
      <p className="shrink-0 text-[16px] font-semibold tabular-nums">
        {formatMoney(expense.amount, state.settings.currency)}
      </p>
    </button>
      <ConfirmDialog
        open={confirm}
        title={`${expense.place} kaydını silmek istiyor musun?`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deleteExpense(expense.id);
          setConfirm(false);
        }}
      />
    </>
  );
}
