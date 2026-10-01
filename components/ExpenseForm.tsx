"use client";

import { useMemo, useState } from "react";
import { formatSuggestion, suggestSpendClass } from "@/lib/classifier";
import { fromDatetimeLocal, parseAmountInput, toDatetimeLocal } from "@/lib/format";
import { useSortedCategories, useSortedMethods, useStore } from "@/lib/store";
import { CLASS_LABEL, type Expense, type ExpenseDraft, type MethodType, type SpendClass } from "@/lib/types";

const METHOD_TYPES: { id: MethodType; label: string }[] = [
  { id: "credit", label: "Kredi Kartı" },
  { id: "debit", label: "Banka" },
  { id: "cash", label: "Nakit" },
];

type Props = {
  expense?: Expense | null;
  nowTs?: number;
  submitLabel?: string;
  onSubmit: (values: ExpenseDraft) => void;
  onDelete?: () => void;
};

export function ExpenseForm({ expense, nowTs, submitLabel = "Kaydet", onSubmit, onDelete }: Props) {
  const { state, places, suggestionForPlace, addMethod, addCategory } = useStore();
  const methods = useSortedMethods();
  const categories = useSortedCategories();
  const nakit = methods.find((method) => method.type === "cash") ?? methods[0];

  const [place, setPlace] = useState(expense?.place ?? "");
  const [amount, setAmount] = useState(
    expense ? String(expense.amount).replace(".", ",") : "",
  );
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [methodId, setMethodId] = useState(expense?.methodId ?? nakit?.id ?? "");
  const [occurredAt, setOccurredAt] = useState(
    expense
      ? toDatetimeLocal(expense.occurredAt)
      : nowTs
        ? toDatetimeLocal(nowTs)
        : "",
  );
  const [note, setNote] = useState(expense?.note ?? "");
  const [installmentsOn, setInstallmentsOn] = useState(
    Boolean(expense?.installmentCount && expense.installmentCount > 1),
  );
  const [installmentCount, setInstallmentCount] = useState(
    String(expense?.installmentCount && expense.installmentCount > 1 ? expense.installmentCount : 2),
  );
  const [showPlaces, setShowPlaces] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodCode, setNewMethodCode] = useState("");
  const [newMethodType, setNewMethodType] = useState<MethodType>("credit");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [spendClass, setSpendClass] = useState<SpendClass>(expense?.spendClass ?? "need");
  const [classTouched, setClassTouched] = useState(Boolean(expense));
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState(false);

  const selectedMethod = methods.find((method) => method.id === methodId);
  const isCredit = selectedMethod?.type === "credit";

  const placeOptions = useMemo(() => {
    const q = place.trim().toLocaleLowerCase("tr-TR");
    return places
      .filter((item) => !q || item.toLocaleLowerCase("tr-TR").includes(q))
      .slice(0, 6);
  }, [place, places]);

  const parsedLive = parseAmountInput(amount) ?? 0;
  const suggestion = useMemo(() => {
    if (!state.settings.aiEnabled) return null;
    if (!place.trim() && !categoryId && parsedLive <= 0) return null;
    return suggestSpendClass(state, { place, amount: parsedLive, categoryId });
  }, [state, place, categoryId, parsedLive]);

  function applySuggestion(value: string) {
    const hint = suggestionForPlace(value);
    if (!hint) {
      setSuggested(false);
      return;
    }
    setCategoryId(hint.categoryId);
    setMethodId(hint.methodId);
    if (!classTouched) setSpendClass(hint.spendClass);
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
    if (!cleanPlace) return setError("Harcama yeri girin.");
    if (parsed == null) return setError("Geçerli bir tutar girin.");
    if (!methodId) return setError("Ödeme yöntemi seçin.");
    if (!categoryId) return setError("Kategori seçin.");
    const count = isCredit && installmentsOn ? Number(installmentCount) : undefined;
    if (count != null && (!Number.isInteger(count) || count < 2)) {
      return setError("Taksit sayısı en az 2 olmalı.");
    }
    setError("");
    onSubmit({
      place: cleanPlace,
      amount: parsed,
      categoryId,
      methodId,
      spendClass,
      aiSuggestedClass: suggestion?.spendClass,
      occurredAt: fromDatetimeLocal(occurredAt || toDatetimeLocal(Date.now())),
      note,
      installmentCount: count,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          autoFocus={!expense}
          placeholder="Migros"
          className="field"
        />
        {showPlaces && placeOptions.length > 0 ? (
          <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-white dark:bg-[#1c1c1e]">
            {placeOptions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[15px]"
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
        <span className="mb-2 block text-[13px] font-medium text-ink-muted">Tutar</span>
        <div className="relative">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            inputMode="decimal"
            enterKeyHint="next"
            placeholder="1.250"
            className="field pr-12 tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-muted">
            ₺
          </span>
        </div>
      </label>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">
          Ödeme Yöntemi
          {suggested ? <span className="ml-2 font-normal text-accent">Önerildi</span> : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setMethodId(method.id);
                setSuggested(false);
                if (method.type !== "credit") setInstallmentsOn(false);
              }}
              className={method.id === methodId ? "chip chip-active" : "chip"}
            >
              {method.code}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setAddingMethod((open) => !open)}>
            + Yeni
          </button>
        </div>
        {selectedMethod ? (
          <p className="mt-2 text-[13px] text-ink-muted">{selectedMethod.name}</p>
        ) : null}
        {addingMethod ? (
          <div className="mt-3 space-y-2">
            <input
              className="field"
              value={newMethodName}
              onChange={(event) => setNewMethodName(event.target.value)}
              placeholder="Enpara Kredi Kartı"
            />
            <div className="flex gap-2">
              <input
                className="field"
                value={newMethodCode}
                onChange={(event) => setNewMethodCode(event.target.value.toUpperCase())}
                placeholder="EPK"
              />
              <select
                className="field w-auto"
                value={newMethodType}
                onChange={(event) => setNewMethodType(event.target.value as MethodType)}
              >
                {METHOD_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const created = addMethod({
                  name: newMethodName,
                  code: newMethodCode,
                  type: newMethodType,
                });
                if (!created) {
                  setError("Yöntem adı veya kod kullanılıyor.");
                  return;
                }
                setMethodId(created.id);
                setAddingMethod(false);
                setNewMethodName("");
                setNewMethodCode("");
              }}
            >
              Yöntemi ekle
            </button>
          </div>
        ) : null}
      </fieldset>

      {isCredit ? (
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Taksitli mi?</legend>
          <div className="flex gap-2">
            <button
              type="button"
              className={!installmentsOn ? "chip chip-active" : "chip"}
              onClick={() => setInstallmentsOn(false)}
            >
              Hayır
            </button>
            <button
              type="button"
              className={installmentsOn ? "chip chip-active" : "chip"}
              onClick={() => setInstallmentsOn(true)}
            >
              Evet
            </button>
          </div>
          {installmentsOn ? (
            <label className="mt-3 block">
              <span className="mb-2 block text-[13px] text-ink-muted">Taksit sayısı</span>
              <input
                className="field tabular-nums"
                inputMode="numeric"
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                placeholder="6"
              />
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">Harcama sınıfı</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["need", "want", "luxury"] as SpendClass[]).map((id) => (
            <button
              key={id}
              type="button"
              className={spendClass === id ? `chip chip-active class-${id}` : `chip class-${id}`}
              onClick={() => {
                setSpendClass(id);
                setClassTouched(true);
              }}
            >
              {CLASS_LABEL[id]}
            </button>
          ))}
        </div>
        {suggestion ? (
          <div className="mt-3 rounded-2xl border border-line bg-[color:var(--white)] px-3 py-3">
            <p className="text-[13px] text-ink-muted">{formatSuggestion(suggestion)}</p>
            {suggestion.warning ? (
              <p className="mt-1 text-[13px] text-ink">{suggestion.warning}</p>
            ) : null}
            {suggestion.spendClass !== spendClass ? (
              <button
                type="button"
                className="mt-2 text-[13px] font-medium text-accent"
                onClick={() => {
                  setSpendClass(suggestion.spendClass);
                  setClassTouched(true);
                }}
              >
                {CLASS_LABEL[suggestion.spendClass]} olarak kullan
              </button>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">
          Kategori
          {suggested ? <span className="ml-2 font-normal text-accent">Önerildi</span> : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
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
          <button type="button" className="chip" onClick={() => setAddingCategory((open) => !open)}>
            + Yeni Kategori
          </button>
        </div>
        {addingCategory ? (
          <div className="mt-3 flex gap-2">
            <input
              className="field"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Kategori adı"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const created = addCategory(newCategory);
                if (!created) return;
                setCategoryId(created.id);
                setNewCategory("");
                setAddingCategory(false);
              }}
            >
              Ekle
            </button>
          </div>
        ) : null}
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-[13px] font-medium text-ink-muted">Tarih</span>
        <input
          type="datetime-local"
          className="field"
          value={occurredAt}
          onFocus={() => {
            if (!occurredAt) setOccurredAt(toDatetimeLocal(Date.now()));
          }}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[13px] font-medium text-ink-muted">Not</span>
        <input
          className="field"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="İsteğe bağlı"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
      {onDelete ? (
        <button type="button" className="btn-danger" onClick={onDelete}>
          Sil
        </button>
      ) : null}
    </form>
  );
}
