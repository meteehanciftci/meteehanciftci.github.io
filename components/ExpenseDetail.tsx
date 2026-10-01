"use client";

import { formatMoney, istanbulParts } from "@/lib/format";
import { CLASS_LABEL, type Expense } from "@/lib/types";
import { useStore } from "@/lib/store";

const monthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ExpenseDetail({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { state } = useStore();
  const category = state.categories.find((item) => item.id === expense.categoryId);
  const method = state.methods.find((item) => item.id === expense.methodId);
  const parts = istanbulParts(expense.occurredAt);
  const clock = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;

  return (
    <div>
      <p className="text-[28px] font-semibold tracking-tight">{expense.place}</p>
      <p className="mt-2 text-[34px] font-semibold tabular-nums tracking-tight">
        {formatMoney(expense.amount, state.settings.currency)}
      </p>
      <p className="mt-1 text-[14px] text-ink-muted">
        {monthFmt.format(new Date(expense.occurredAt))} · {clock}
      </p>
      <dl className="mt-8">
        <DetailRow label="Harcama sınıfı" value={CLASS_LABEL[expense.spendClass]} />
        <DetailRow label="Kategori" value={category?.name ?? "—"} />
        <DetailRow label="Ödeme yöntemi" value={method ? `${method.name}` : "—"} />
        <DetailRow label="Not" value={expense.note || "—"} />
      </dl>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button type="button" className="btn-secondary w-full" onClick={onEdit}>
          Düzenle
        </button>
        <button type="button" className="btn-danger" onClick={onDelete}>
          Sil
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-3">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-right text-[15px] font-medium">{value}</dd>
    </div>
  );
}
