"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { useSortedCategories, useStore } from "@/lib/store";
import type { DateFilter, ExpenseFilters } from "@/lib/types";
import { UNSPECIFIED_SOURCE_LABEL } from "@/lib/domain";

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "today", label: "Bugün" },
  { id: "this-week", label: "Bu hafta" },
  { id: "this-month", label: "Bu ay" },
  { id: "last-month", label: "Geçen ay" },
  { id: "custom", label: "Özel tarih" },
];

type Props = {
  value: ExpenseFilters;
  onChange: (next: ExpenseFilters) => void;
};

export function FilterSheet({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const categories = useSortedCategories();
  const { state } = useStore();
  const active =
    value.date !== "all" ||
    value.categoryId ||
    value.bankId ||
    value.paymentSourceId ||
    value.methodId ||
    value.unspecifiedSource ||
    value.place ||
    value.minAmount ||
    value.maxAmount ||
    value.query;

  const banksInUse = state.banks.filter((bank) =>
    state.paymentSources.some((source) => source.bankId === bank.id),
  );

  return (
    <>
      <button type="button" className="icon-btn press relative" onClick={() => setOpen(true)} aria-label="Filtrele">
        <Icon icon={SlidersHorizontal} size={22} />
        {active ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /> : null}
      </button>
      <Sheet open={open} title="Filtreler" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-5 pb-4">
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-muted">Tarih</legend>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={value.date === option.id ? "chip chip-active" : "chip"}
                  onClick={() => onChange({ ...value, date: option.id })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {value.date === "custom" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="field"
                  value={value.customFrom ?? ""}
                  onChange={(event) => onChange({ ...value, customFrom: event.target.value })}
                />
                <input
                  type="date"
                  className="field"
                  value={value.customTo ?? ""}
                  onChange={(event) => onChange({ ...value, customTo: event.target.value })}
                />
              </div>
            ) : null}
          </fieldset>

          <label>
            <span className="mb-2 block text-[13px] font-medium text-ink-muted">Kategori</span>
            <select
              className="field"
              value={value.categoryId}
              onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
            >
              <option value="">Tümü</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-[13px] font-medium text-ink-muted">Banka</span>
            <select
              className="field"
              value={value.bankId}
              onChange={(event) =>
                onChange({ ...value, bankId: event.target.value, paymentSourceId: "", methodId: "", unspecifiedSource: false })
              }
            >
              <option value="">Tümü</option>
              {banksInUse.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-[13px] font-medium text-ink-muted">Ödeme kaynağı</span>
            <select
              className="field"
              value={value.unspecifiedSource ? "unspecified" : value.paymentSourceId || value.methodId}
              onChange={(event) => {
                const next = event.target.value;
                onChange({
                  ...value,
                  unspecifiedSource: next === "unspecified",
                  paymentSourceId: next === "unspecified" ? "" : next,
                  methodId: next === "unspecified" ? "" : next,
                });
              }}
            >
              <option value="">Tümü</option>
              <option value="unspecified">{UNSPECIFIED_SOURCE_LABEL}</option>
              {state.paymentSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() =>
              onChange({
                ...value,
                date: "all",
                categoryId: "",
                bankId: "",
                paymentSourceId: "",
                methodId: "",
                unspecifiedSource: false,
                place: "",
                spendClass: "",
                minAmount: "",
                maxAmount: "",
                customFrom: "",
                customTo: "",
                query: "",
              })
            }
          >
            Temizle
          </button>
        </div>
      </Sheet>
    </>
  );
}
