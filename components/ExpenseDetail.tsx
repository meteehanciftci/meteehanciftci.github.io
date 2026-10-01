"use client";

import { formatMoney, istanbulParts } from "@/lib/format";
import { CLASS_LABEL, type Expense } from "@/lib/types";
import { useStore } from "@/lib/store";
import { CalendarDays, FileText, Pencil, Tags, Trash2, WalletCards, type LucideIcon } from "lucide-react";
import { CategoryMark } from "./category-icon";
import { Icon } from "./Icon";

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
      <div className="flex items-center gap-3">
        <CategoryMark name={category?.name} size={20} />
        <p className="text-[28px] font-semibold tracking-tight">{expense.place}</p>
      </div>
      <p className="mt-4 text-[34px] font-semibold tabular-nums tracking-tight">
        {formatMoney(expense.amount, state.settings.currency)}
      </p>
      <p className="mt-1 text-[14px] text-ink-muted">
        {category?.name ?? "Kategori"} · {CLASS_LABEL[expense.spendClass]}
      </p>
      <dl className="mt-6">
        <DetailRow icon={CalendarDays} label="Tarih" value={`${monthFmt.format(new Date(expense.occurredAt))} · ${clock}`} />
        <DetailRow icon={WalletCards} label="Ödeme" value={method ? `${method.code} · ${method.name}` : "—"} />
        <DetailRow icon={Tags} label="Kategori" value={category?.name ?? "—"} />
        <DetailRow icon={FileText} label="Not" value={expense.note || "—"} />
      </dl>
      <div className="mt-8 flex items-center justify-between">
        <button type="button" className="press inline-flex min-h-11 items-center gap-2 text-[15px] font-medium" onClick={onEdit}>
          <Icon icon={Pencil} size={18} /> Düzenle
        </button>
        <button type="button" className="press inline-flex min-h-11 items-center gap-2 text-[15px] text-ink-muted" onClick={onDelete}>
          <Icon icon={Trash2} size={18} /> Sil
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3">
      <dt className="flex items-center gap-2 text-[13px] text-ink-muted">
        <Icon icon={icon} size={18} /> {label}
      </dt>
      <dd className="text-right text-[15px] font-medium">{value}</dd>
    </div>
  );
}
