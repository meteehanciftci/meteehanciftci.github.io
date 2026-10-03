"use client";

import { useMemo, useState } from "react";
import { searchCatalog } from "@/lib/banks/catalog";
import { SOURCE_TYPE_LABEL, type PaymentSource, type PaymentSourceType } from "@/lib/types";
import { Check } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { useStore } from "@/lib/store";

const TYPES: PaymentSourceType[] = ["cash", "bank_account", "credit_card", "overdraft"];

export function PaymentSourceSheet({
  open,
  currentId,
  onClose,
  onSelect,
}: {
  open: boolean;
  currentId?: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { state, addSource, addBank } = useStore();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PaymentSourceType>("bank_account");
  const [bankId, setBankId] = useState("");
  const [name, setName] = useState("");
  const [manualName, setManualName] = useState("");
  const [error, setError] = useState("");

  const sources = useMemo(
    () =>
      [...state.paymentSources]
        .filter((source) => !source.archived || source.id === currentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || b.lastUsedAt - a.lastUsedAt),
    [state.paymentSources, currentId],
  );

  const catalog = searchCatalog(query);

  function reset() {
    setCreating(false);
    setQuery("");
    setType("bank_account");
    setBankId("");
    setName("");
    setManualName("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function create() {
    const sourceType = type;
    let selectedBank = bankId;
    if (sourceType === "cash") selectedBank = "";
    if (sourceType !== "cash" && !selectedBank && manualName.trim()) {
      const created = addBank(manualName);
      if (!created) {
        setError("Banka adı girin.");
        return;
      }
      selectedBank = created.id;
    }
    const created = addSource({
      type: sourceType,
      bankId: sourceType === "cash" ? null : selectedBank || null,
      name: name.trim() || (sourceType === "cash" ? "Cüzdan" : "Hesap"),
    });
    if (!created) {
      setError("Ödeme kaynağı eklenemedi. Banka, tür ve kısa bir ad gerekli.");
      return;
    }
    onSelect(created.id);
    reset();
    onClose();
  }

  return (
    <Sheet open={open} title={creating ? "Ödeme kaynağı ekle" : "Ödeme kaynağı"} onClose={handleClose}>
      {!creating ? (
        <>
          <ul>
            {sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                selected={source.id === currentId}
                onSelect={() => {
                  onSelect(source.id);
                  handleClose();
                }}
              />
            ))}
          </ul>
          {sources.length === 0 ? (
            <p className="py-6 text-sm text-ink-muted">Henüz ödeme kaynağı yok.</p>
          ) : null}
          <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setCreating(true)}>
            Yeni ödeme kaynağı
          </button>
        </>
      ) : (
        <div className="space-y-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((id) => (
              <button
                key={id}
                type="button"
                className={type === id ? "chip chip-active" : "chip"}
                onClick={() => {
                  setType(id);
                  if (id === "cash") setBankId("");
                }}
              >
                {SOURCE_TYPE_LABEL[id]}
              </button>
            ))}
          </div>
          {type !== "cash" ? (
            <>
              <label>
                <span className="mb-2 block text-[13px] text-ink-muted">Banka ara</span>
                <input
                  className="field"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="İş Bankası, Garanti, Ziraat…"
                />
              </label>
              <ul className="max-h-56 overflow-y-auto">
                {catalog.map((entry) => {
                  const bank = state.banks.find((item) => item.id === entry.id);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="row-link"
                        onClick={() => {
                          setBankId(entry.id);
                          setManualName("");
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <BankLogo bank={bank ?? { ...entry, isManual: false }} size="picker" />
                          <span>
                            {entry.name}
                            <span className="ml-2 text-[12px] text-ink-muted">{entry.shortCode}</span>
                          </span>
                        </span>
                        {bankId === entry.id ? <Icon icon={Check} size={18} /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label>
                <span className="mb-2 block text-[13px] text-ink-muted">Katalogda yoksa diğer banka</span>
                <input
                  className="field"
                  value={manualName}
                  onChange={(event) => {
                    setManualName(event.target.value);
                    setBankId("");
                  }}
                  placeholder="Banka adı"
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Nakit için banka seçilmez.</p>
          )}
          <label>
            <span className="mb-2 block text-[13px] text-ink-muted">Kısa ad</span>
            <input
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={type === "cash" ? "Cüzdan" : "Günlük hesap"}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
              Geri
            </button>
            <button type="button" className="btn-primary" onClick={create}>
              Kaydet
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function SourceRow({
  source,
  selected,
  onSelect,
}: {
  source: PaymentSource;
  selected: boolean;
  onSelect: () => void;
}) {
  const { state } = useStore();
  const bank = source.bankId ? state.banks.find((item) => item.id === source.bankId) : null;
  return (
    <li>
      <button type="button" className="row-link" onClick={onSelect}>
        <span className="flex min-w-0 items-center gap-3">
          <BankLogo bank={source.type === "cash" ? null : bank} size="picker" />
          <span className="min-w-0 text-left">
            <span className="block truncate">{source.name}</span>
            <span className="block text-[12px] text-ink-muted">
              {source.type === "cash" ? "Nakit" : bank?.name ?? "Banka"} · {SOURCE_TYPE_LABEL[source.type]}
              {source.isDefault ? " · Varsayılan" : ""}
              {source.archived ? " · Arşivli" : ""}
            </span>
          </span>
        </span>
        {selected ? <Icon icon={Check} size={18} /> : null}
      </button>
    </li>
  );
}
