import Link from "next/link";
import { formatExpenseDate, formatLiraExact } from "@/lib/format";
import type { Category, Expense, PaymentMethod } from "@/lib/types";

type Props = {
  expense: Expense;
  category?: Category;
  method?: PaymentMethod;
};

export function ExpenseRow({ expense, category, method }: Props) {
  return (
    <Link
      href={`/duzenle?id=${expense.id}`}
      className="flex items-start justify-between gap-4 py-3.5 transition-opacity active:opacity-70"
    >
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold tracking-tight text-ink">
          {expense.place}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {category?.name ?? "Kategori"} · {method?.name ?? "Ödeme"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[16px] font-semibold tabular-nums tracking-tight text-ink">
          {formatLiraExact(expense.amount)}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {formatExpenseDate(expense.createdAt)}
        </p>
      </div>
    </Link>
  );
}
