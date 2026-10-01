"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useSortedCategories, useSortedMethods } from "@/lib/store";
import { CLASS_LABEL, type DateFilter, type ExpenseFilters, type SpendClass } from "@/lib/types";

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "today", label: "Bugün" },
  { id: "this-week", label: "Bu Hafta" },
  { id: "this-month", label: "Bu Ay" },
  { id: "last-month", label: "Geçen Ay" },
  { id: "custom", label: "Özel Tarih" },
];

type Props = {
  value: ExpenseFilters;
  onChange: (next: ExpenseFilters) => void;
};

export function FilterSheet({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const categories = useSortedCategories();
  const methods = useSortedMethods();
  const active =
    value.date !== "all" ||
    value.categoryId ||
    value.methodId ||
    value.place ||
    value.spendClass ||
    value.minAmount ||
    value.maxAmount;

  return (
    <>
      <button type="button" className="chip" onClick={() => setOpen(true)}>
        Filtre{active ? " · açık" : ""}
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
                  onChange={(event) =>
                    onChange({ ...value, customFrom: event.target.value })
                  }
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

          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-muted">Harcama sınıfı</legend>
            <div className="flex flex-wrap gap-2">
              {(["need", "want", "luxury"] as SpendClass[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={value.spendClass === id ? "chip chip-active" : "chip"}
                  onClick={() =>
                    onChange({ ...value, spendClass: value.spendClass === id ? "" : id })
                  }
                >
                  {CLASS_LABEL[id]}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span className="mb-2 block text-[13px] font-medium text-ink-muted">Harcama yeri</span>
            <input
              className="field"
              value={value.place}
              onChange={(event) => onChange({ ...value, place: event.target.value })}
              placeholder="Migros"
            />
          </label>

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
            <span className="mb-2 block text-[13px] font-medium text-ink-muted">
              Ödeme yöntemi
            </span>
            <select
              className="field"
              value={value.methodId}
              onChange={(event) => onChange({ ...value, methodId: event.target.value })}
            >
              <option value="">Tümü</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.code} — {method.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-2 block text-[13px] font-medium text-ink-muted">Min ₺</span>
              <input
                className="field tabular-nums"
                inputMode="decimal"
                value={value.minAmount}
                onChange={(event) => onChange({ ...value, minAmount: event.target.value })}
              />
            </label>
            <label>
              <span className="mb-2 block text-[13px] font-medium text-ink-muted">Max ₺</span>
              <input
                className="field tabular-nums"
                inputMode="decimal"
                value={value.maxAmount}
                onChange={(event) => onChange({ ...value, maxAmount: event.target.value })}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() =>
              onChange({
                ...value,
                date: "all",
                categoryId: "",
                methodId: "",
                place: "",
                spendClass: "",
                minAmount: "",
                maxAmount: "",
                customFrom: "",
                customTo: "",
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
