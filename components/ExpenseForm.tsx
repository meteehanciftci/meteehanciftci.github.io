"use client";

import { useMemo, useState } from "react";
import { suggestSpendClass } from "@/lib/classifier";
import { formatMoney, fromDatetimeLocal, parseAmountInput, toDatetimeLocal } from "@/lib/format";
import { useSortedCategories, useSortedMethods, useStore } from "@/lib/store";
import { CLASS_LABEL, type Expense, type ExpenseDraft, type MethodType, type SpendClass } from "@/lib/types";
import { Check, ChevronRight, Diamond, FileText, ShieldCheck, Sparkles, Store, Tags, WalletCards, CalendarDays, CreditCard, Landmark, Wallet } from "lucide-react";
import { CategoryMark } from "./category-icon";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

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

export function ExpenseForm({ expense, nowTs, submitLabel = "Kaydet", onSubmit }: Props) {
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
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodCode, setNewMethodCode] = useState("");
  const [newMethodType, setNewMethodType] = useState<MethodType>("credit");
  const [newCategory, setNewCategory] = useState("");
  const [spendClass, setSpendClass] = useState<SpendClass>(expense?.spendClass ?? "need");
  const [classTouched, setClassTouched] = useState(Boolean(expense));
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

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

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const shownAmount = parsedLive > 0 ? formatMoney(parsedLive, state.settings.currency) : "₺ 0,00";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <label className="block">
        <span className="flex items-center gap-2 text-[13px] text-ink-muted">
          <Icon icon={Store} size={18} /> Harcama yeri
        </span>
        <input
          value={place}
          onChange={(event) => handlePlaceChange(event.target.value)}
          onFocus={() => setShowPlaces(true)}
          onBlur={() => window.setTimeout(() => setShowPlaces(false), 120)}
          autoComplete="off"
          autoFocus={!expense}
          placeholder="Migros"
          className="plain"
        />
        {showPlaces && placeOptions.length > 0 ? (
          <ul className="mb-2">
            {placeOptions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="row-link"
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

      <label className="mt-6 block">
        <span className="text-[13px] text-ink-muted">Tutar</span>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Tutar"
          className="amount-input"
        />
        <p className="text-[13px] text-ink-muted">{shownAmount}</p>
      </label>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {([
          ["need", ShieldCheck],
          ["want", Sparkles],
          ["luxury", Diamond],
        ] as const).map(([id, glyph]) => (
          <button
            key={id}
            type="button"
            className={spendClass === id ? `chip chip-active class-${id} press inline-flex items-center justify-center gap-1` : `chip class-${id} press inline-flex items-center justify-center gap-1`}
            onClick={() => {
              setSpendClass(id);
              setClassTouched(true);
            }}
          >
            <Icon icon={glyph} size={18} />
            {CLASS_LABEL[id]}
          </button>
        ))}
      </div>
      {suggestion ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-left text-[13px] text-ink-muted"
            onClick={() => setAiOpen((open) => !open)}
          >
            <Icon icon={Sparkles} size={18} />
            AI: {CLASS_LABEL[suggestion.spendClass]} · %{Math.round(suggestion.confidence * 100)}
          </button>
          {suggestion.spendClass !== spendClass ? (
            <button
              type="button"
              className="text-[13px] font-semibold"
              onClick={() => {
                setSpendClass(suggestion.spendClass);
                setClassTouched(true);
              }}
            >
              Uygula
            </button>
          ) : null}
        </div>
      ) : null}
      {aiOpen && suggestion?.warning ? <p className="mt-1 text-[13px] text-ink-muted">{suggestion.warning}</p> : null}

      <button type="button" className="row-link mt-4" onClick={() => setCategoryOpen(true)}>
        <span className="flex items-center gap-3">
          <Icon icon={Tags} size={18} />
          <span>
            <span className="block text-[12px] text-ink-muted">Kategori{suggested ? " · önerildi" : ""}</span>
            {selectedCategory?.name ?? "Seç"}
          </span>
        </span>
        <Icon icon={ChevronRight} size={18} />
      </button>
      <button type="button" className="row-link" onClick={() => setMethodOpen(true)}>
        <span className="flex items-center gap-3">
          <Icon icon={WalletCards} size={18} />
          <span>
            <span className="block text-[12px] text-ink-muted">Ödeme yöntemi</span>
            {selectedMethod ? `${selectedMethod.code} · ${selectedMethod.name}` : "Seç"}
          </span>
        </span>
        <Icon icon={ChevronRight} size={18} />
      </button>
      <label className="row-link">
        <span className="flex items-center gap-3">
          <Icon icon={CalendarDays} size={18} />
          <span>
            <span className="block text-[12px] text-ink-muted">Tarih</span>
            <input
              type="datetime-local"
              className="plain !px-0 !py-0"
              value={occurredAt}
              onFocus={() => {
                if (!occurredAt) setOccurredAt(toDatetimeLocal(Date.now()));
              }}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </span>
        </span>
        <Icon icon={ChevronRight} size={18} />
      </label>
      <label className="row-link">
        <span className="flex items-center gap-3">
          <Icon icon={FileText} size={18} />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-ink-muted">Not</span>
            <input
              className="plain !px-0 !py-0"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Not ekle"
            />
          </span>
        </span>
      </label>

      {isCredit ? (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[14px]">Taksit</span>
          <button
            type="button"
            className={installmentsOn ? "chip chip-active" : "chip"}
            onClick={() => setInstallmentsOn((on) => !on)}
          >
            {installmentsOn ? `${installmentCount} taksit` : "Yok"}
          </button>
        </div>
      ) : null}
      {isCredit && installmentsOn ? (
        <input
          className="plain tabular-nums"
          inputMode="numeric"
          value={installmentCount}
          onChange={(event) => setInstallmentCount(event.target.value)}
          aria-label="Taksit sayısı"
        />
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary press mt-8 gap-2">
        <Icon icon={Check} size={20} /> {submitLabel === "Kaydet" ? "Harcamayı Kaydet" : submitLabel}
      </button>

      <Sheet open={categoryOpen} title="Kategori" onClose={() => setCategoryOpen(false)}>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                className="row-link"
                onClick={() => {
                  setCategoryId(category.id);
                  setSuggested(false);
                  setCategoryOpen(false);
                }}
              >
                <span className="flex items-center gap-3">
                  <CategoryMark name={category.name} />
                  {category.name}
                </span>
                {category.id === categoryId ? <Icon icon={Check} size={18} /> : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="plain"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Yeni kategori"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const created = addCategory(newCategory);
              if (!created) return;
              setCategoryId(created.id);
              setNewCategory("");
              setCategoryOpen(false);
            }}
          >
            Ekle
          </button>
        </div>
      </Sheet>

      <Sheet open={methodOpen} title="Ödeme yöntemi" onClose={() => setMethodOpen(false)}>
        <ul>
          {methods.map((method) => (
            <li key={method.id}>
              <button
                type="button"
                className="row-link"
                onClick={() => {
                  setMethodId(method.id);
                  if (method.type !== "credit") setInstallmentsOn(false);
                  setMethodOpen(false);
                }}
              >
                <span className="flex items-center gap-3">
                  <Icon icon={method.type === "credit" ? CreditCard : method.type === "debit" ? Landmark : Wallet} size={18} />
                  <span>
                    {method.code}
                    <span className="ml-2 text-ink-muted">{method.name}</span>
                  </span>
                </span>
                {method.id === methodId ? <Icon icon={Check} size={18} /> : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2">
          <input className="plain" value={newMethodName} onChange={(event) => setNewMethodName(event.target.value)} placeholder="Yöntem adı" />
          <div className="flex gap-2">
            <input className="plain" value={newMethodCode} onChange={(event) => setNewMethodCode(event.target.value.toUpperCase())} placeholder="Kod" />
            <select className="plain" value={newMethodType} onChange={(event) => setNewMethodType(event.target.value as MethodType)}>
              {METHOD_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const created = addMethod({ name: newMethodName, code: newMethodCode, type: newMethodType });
              if (!created) {
                setError("Yöntem adı veya kod kullanılıyor.");
                return;
              }
              setMethodId(created.id);
              setNewMethodName("");
              setNewMethodCode("");
              setMethodOpen(false);
            }}
          >
            Yöntemi ekle
          </button>
        </div>
      </Sheet>
    </form>
  );
}
