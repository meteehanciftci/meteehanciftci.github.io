"use client";

import { useMemo, useRef, useState } from "react";
import { defaultSourceId, recentSources } from "@/lib/domain";
import { fromExpenseDay, toExpenseDay } from "@/lib/format";
import { amountErrorMessage, formatKurus, parseAmountToKurus } from "@/lib/money";
import { useSortedCategories, useStore } from "@/lib/store";
import type { Expense, ExpenseDraft } from "@/lib/types";
import { CalendarDays, Check, ChevronRight, FileText, Tags, WalletCards } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { CategoryMark } from "./category-icon";
import { Icon } from "./Icon";
import { PaymentSourceSheet } from "./PaymentSourceSheet";
import { Sheet } from "./Sheet";

type Props = {
  expense?: Expense | null;
  nowTs?: number;
  submitLabel?: string;
  onSubmit: (values: ExpenseDraft) => boolean | void;
  onDelete?: () => void;
};

export function ExpenseForm({ expense, nowTs, submitLabel = "Kaydet", onSubmit, onDelete }: Props) {
  const { state, suggestionForPlace } = useStore();
  const categories = useSortedCategories();
  const fallbackSource = defaultSourceId(state.paymentSources);
  const [amount, setAmount] = useState(
    expense ? formatKurus(expense.amountKurus).replace(" ₺", "").replace(" €", "").replace(" $", "") : "",
  );
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? "");
  const [paymentSourceId, setPaymentSourceId] = useState<string | null>(
    expense ? expense.paymentSourceId : fallbackSource,
  );
  const [occurredOn, setOccurredOn] = useState(expense?.occurredOn ?? toExpenseDay(nowTs ?? Date.now()));
  const [place, setPlace] = useState(expense?.place ?? expense?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { addCategory } = useStore();
  const lock = useRef(false);

  const selectedSource = state.paymentSources.find((source) => source.id === paymentSourceId) ?? null;
  const selectedBank = selectedSource?.bankId
    ? state.banks.find((bank) => bank.id === selectedSource.bankId)
    : null;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const recents = recentSources(state.paymentSources, state.expenses, 3);
  const parsed = parseAmountToKurus(amount);

  const placeOptions = useMemo(() => {
    const q = place.trim().toLocaleLowerCase("tr-TR");
    return state.expenses
      .map((item) => item.place)
      .filter((item, index, all) => item && all.indexOf(item) === index)
      .filter((item) => !q || item.toLocaleLowerCase("tr-TR").includes(q))
      .slice(0, 5);
  }, [place, state.expenses]);

  function applyPlace(value: string) {
    setPlace(value);
    const hint = suggestionForPlace(value);
    if (!hint || expense) return;
    if (hint.categoryId) setCategoryId(hint.categoryId);
    if (hint.paymentSourceId) setPaymentSourceId(hint.paymentSourceId);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current || busy) return;
    if (!parsed.ok) {
      setError(amountErrorMessage(parsed.reason));
      return;
    }
    if (!categoryId) {
      setError("Kategori seçin.");
      return;
    }
    if (!paymentSourceId) {
      setError("Ödeme kaynağı seçin.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    const result = onSubmit({
      place: place.trim(),
      amountKurus: parsed.kurus,
      categoryId,
      paymentSourceId,
      spendClass: expense?.spendClass ?? "need",
      occurredOn,
      occurredAt: fromExpenseDay(occurredOn),
      note: place.trim(),
    });
    if (result === false) {
      lock.current = false;
      setBusy(false);
      setError("Kayıt tamamlanamadı. Form içeriği korundu.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <label className="block">
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
        <p className="text-[13px] text-ink-muted">
          {parsed.ok ? formatKurus(parsed.kurus, state.settings.currency) : "125 · 125,50 · 1.250,50"}
        </p>
      </label>

      <button type="button" className="row-link mt-4" onClick={() => setCategoryOpen(true)}>
        <span className="flex items-center gap-3">
          <Icon icon={Tags} size={18} />
          <span>
            <span className="block text-[12px] text-ink-muted">Kategori</span>
            {selectedCategory?.name ?? "Seç"}
          </span>
        </span>
        <Icon icon={ChevronRight} size={18} />
      </button>

      <button type="button" className="row-link" onClick={() => setSourceOpen(true)}>
        <span className="flex min-w-0 items-center gap-3">
          <Icon icon={WalletCards} size={18} />
          <BankLogo bank={selectedSource?.type === "cash" ? null : selectedBank} size="picker" />
          <span className="min-w-0 text-left">
            <span className="block text-[12px] text-ink-muted">Ödeme kaynağı</span>
            <span className="block truncate">
              {selectedSource
                ? `${selectedSource.type === "cash" ? "Nakit" : selectedBank?.name ?? "Banka"} / ${selectedSource.name}`
                : "Seç"}
            </span>
          </span>
        </span>
        <Icon icon={ChevronRight} size={18} />
      </button>

      {recents.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {recents.map((source) => {
            const bank = source.bankId ? state.banks.find((item) => item.id === source.bankId) : null;
            return (
              <button
                key={source.id}
                type="button"
                className={paymentSourceId === source.id ? "chip chip-active" : "chip"}
                onClick={() => setPaymentSourceId(source.id)}
              >
                <BankLogo bank={source.type === "cash" ? null : bank} size="row" />
                {source.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <label className="row-link">
        <span className="flex items-center gap-3">
          <Icon icon={CalendarDays} size={18} />
          <span>
            <span className="block text-[12px] text-ink-muted">Tarih</span>
            <input
              type="date"
              className="plain !px-0 !py-0"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
            />
          </span>
        </span>
      </label>

      <label className="row-link">
        <span className="flex w-full items-center gap-3">
          <Icon icon={FileText} size={18} />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-ink-muted">Açıklama veya işletme (isteğe bağlı)</span>
            <input
              className="plain !px-0 !py-0"
              value={place}
              onChange={(event) => applyPlace(event.target.value)}
              placeholder="Migros"
            />
          </span>
        </span>
      </label>
      {placeOptions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {placeOptions.map((item) => (
            <button key={item} type="button" className="chip" onClick={() => applyPlace(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary press mt-8 gap-2" disabled={busy}>
        <Icon icon={Check} size={20} /> {busy ? "Kaydediliyor…" : submitLabel}
      </button>
      {onDelete ? (
        <button type="button" className="btn-danger mt-3" onClick={onDelete}>
          Sil
        </button>
      ) : null}

      <Sheet open={categoryOpen} title="Kategori" onClose={() => setCategoryOpen(false)}>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                className="row-link"
                onClick={() => {
                  setCategoryId(category.id);
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

      <PaymentSourceSheet
        open={sourceOpen}
        currentId={paymentSourceId}
        onClose={() => setSourceOpen(false)}
        onSelect={setPaymentSourceId}
      />
    </form>
  );
}

