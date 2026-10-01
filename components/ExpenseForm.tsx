"use client";

import { useMemo, useState } from "react";
import { parseAmountInput } from "@/lib/format";
import { useSortedMethods, useStore } from "@/lib/store";
import type { Expense } from "@/lib/types";

type Props = {
  expense?: Expense;
  submitLabel: string;
  onSubmit: (values: {
    place: string;
    amount: number;
    categoryId: string;
    methodId: string;
  }) => void;
  onDelete?: () => void;
};

export function ExpenseForm({ expense, submitLabel, onSubmit, onDelete }: Props) {
  const { state, places, suggestionForPlace, addMethod } = useStore();
  const methods = useSortedMethods();
  const [place, setPlace] = useState(expense?.place ?? "");
  const [amount, setAmount] = useState(
    expense ? String(expense.amount).replace(".", ",") : "",
  );
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [methodId, setMethodId] = useState(expense?.methodId ?? "");
  const [showPlaces, setShowPlaces] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);
  const [newMethod, setNewMethod] = useState("");
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState(false);

  const placeOptions = useMemo(() => {
    const q = place.trim().toLocaleLowerCase("tr-TR");
    return places
      .filter((item) => !q || item.toLocaleLowerCase("tr-TR").includes(q))
      .slice(0, 6);
  }, [place, places]);

  function applySuggestion(value: string) {
    const hint = suggestionForPlace(value);
    if (!hint) {
      setSuggested(false);
      return;
    }
    setCategoryId(hint.categoryId);
    setMethodId(hint.methodId);
    setSuggested(true);
  }

  function handlePlaceChange(value: string) {
    setPlace(value);
    applySuggestion(value);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanPlace = place.trim();
    const parsed = parseAmountInput(amount);
    if (!cleanPlace) {
      setError("Harcama yeri girin.");
      return;
    }
    if (parsed == null) {
      setError("Geçerli bir miktar girin.");
      return;
    }
    if (!methodId) {
      setError("Ödeme yöntemi seçin.");
      return;
    }
    if (!categoryId) {
      setError("Kategori seçin.");
      return;
    }
    setError("");
    onSubmit({
      place: cleanPlace,
      amount: parsed,
      categoryId,
      methodId,
    });
  }

  function handleAddMethod() {
    const created = addMethod(newMethod);
    if (!created) {
      setError("Bu ödeme yöntemi zaten var veya boş.");
      return;
    }
    setMethodId(created.id);
    setNewMethod("");
    setAddingMethod(false);
    setSuggested(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <label className="block">
        <span className="mb-2 block text-[13px] font-medium text-ink-muted">
          Harcama Yeri
        </span>
        <input
          value={place}
          onChange={(event) => handlePlaceChange(event.target.value)}
          onFocus={() => setShowPlaces(true)}
          onBlur={() => window.setTimeout(() => setShowPlaces(false), 120)}
          autoComplete="off"
          placeholder="Migros, Shell, Starbucks"
          className="field"
        />
        {showPlaces && placeOptions.length > 0 ? (
          <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {placeOptions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[15px] hover:bg-canvas"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    handlePlaceChange(item);
                    setShowPlaces(false);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-[13px] font-medium text-ink-muted">
          Harcama Miktarı
        </span>
        <div className="relative">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={() => {
              const parsed = parseAmountInput(amount);
              if (parsed != null) {
                setAmount(
                  parsed.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                );
              }
            }}
            inputMode="decimal"
            enterKeyHint="done"
            placeholder="1.250,00"
            className="field pr-12 tabular-nums"
            aria-describedby="amount-suffix"
          />
          <span
            id="amount-suffix"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-muted"
          >
            TL
          </span>
        </div>
      </label>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">
          Ödeme Yöntemi
          {suggested ? (
            <span className="ml-2 font-normal text-accent">Önerildi</span>
          ) : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setMethodId(method.id);
                setSuggested(false);
              }}
              className={method.id === methodId ? "chip chip-active" : "chip"}
            >
              {method.name}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            onClick={() => setAddingMethod((open) => !open)}
          >
            + Yeni
          </button>
        </div>
        {addingMethod ? (
          <div className="mt-3 flex gap-2">
            <input
              value={newMethod}
              onChange={(event) => setNewMethod(event.target.value)}
              placeholder="Yöntem adı"
              className="field"
            />
            <button type="button" className="btn-secondary shrink-0" onClick={handleAddMethod}>
              Ekle
            </button>
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">
          Kategori
          {suggested ? (
            <span className="ml-2 font-normal text-accent">Önerildi</span>
          ) : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {state.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id);
                setSuggested(false);
              }}
              className={category.id === categoryId ? "chip chip-active" : "chip"}
            >
              {category.name}
            </button>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-[calc(4.85rem+env(safe-area-inset-bottom))] z-20 -mx-5 space-y-1 border-t border-line/70 bg-canvas/95 px-5 py-3 backdrop-blur-sm">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        {onDelete ? (
          <button type="button" className="btn-danger mt-1" onClick={onDelete}>
            Sil
          </button>
        ) : null}
      </div>
    </form>
  );
}
