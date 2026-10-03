"use client";

import { UNSPECIFIED_SOURCE_LABEL } from "@/lib/domain";
import { istanbulParts } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { useStore } from "@/lib/store";
import { CalendarDays, FileText, Pencil, Tags, Trash2, WalletCards, type LucideIcon } from "lucide-react";
import { AmountText } from "./AmountText";
import { BankLogo } from "./BankLogo";
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
  const source = state.paymentSources.find((item) => item.id === expense.paymentSourceId);
  const bank = source?.bankId ? state.banks.find((item) => item.id === source.bankId) : null;
  const parts = istanbulParts(expense.occurredAt);
  const clock = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  const title = expense.place || category?.name || "Harcama";

  return (
    <div>
      <div className="flex items-center gap-3">
        <CategoryMark name={category?.name} size={20} />
        <p className="text-[28px] font-semibold tracking-tight">{title}</p>
      </div>
      <p className="mt-4 text-[34px] font-semibold tabular-nums tracking-tight">
        <AmountText kurus={expense.amountKurus} />
      </p>
      <dl className="mt-6">
        <DetailRow
          icon={CalendarDays}
          label="Tarih"
          value={`${monthFmt.format(new Date(expense.occurredAt))} · ${clock}`}
        />
        <div className="flex items-center justify-between gap-4 border-t border-line py-3">
          <dt className="flex items-center gap-2 text-[13px] text-ink-muted">
            <Icon icon={WalletCards} size={18} /> Ödeme kaynağı
          </dt>
          <dd className="flex items-center gap-2 text-right text-[15px] font-medium">
            <BankLogo bank={source?.type === "cash" ? null : bank} size="row" />
            {source
              ? `${source.type === "cash" ? "Nakit" : bank?.name ?? "Banka"} / ${source.name}`
              : UNSPECIFIED_SOURCE_LABEL}
          </dd>
        </div>
        <DetailRow icon={Tags} label="Kategori" value={category?.name ?? "—"} />
        <DetailRow icon={FileText} label="Açıklama" value={expense.place || expense.note || "—"} />
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
