"use client";

import { useState } from "react";
import { BackupPanel } from "@/components/BackupPanel";
import { useSortedCategories, useSortedMethods, useStore } from "@/lib/store";
import type { CurrencyCode, MethodType, ThemePreference } from "@/lib/types";

const METHOD_TYPES: { id: MethodType; label: string }[] = [
  { id: "credit", label: "Kredi Kartı" },
  { id: "debit", label: "Banka Kartı / Hesap" },
  { id: "cash", label: "Nakit" },
];

export default function SettingsPage() {
  const {
    state,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    addMethod,
    updateMethod,
    deleteMethod,
    updateSettings,
  } = useStore();
  const methods = useSortedMethods();
  const categories = useSortedCategories();
  const [newCategory, setNewCategory] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<MethodType>("credit");

  return (
    <main className="px-5 pt-8 pb-8">
      <p className="text-[13px] font-medium text-ink-muted">Ayarlar</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Defter</h1>
      <BackupPanel />

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Ödeme yöntemleri</h2>
        <ul className="space-y-3">
          {methods.map((method) => (
            <li key={method.id} className="rounded-2xl border border-line bg-[color:var(--white)] p-3">
              <input
                className="field"
                defaultValue={method.name}
                aria-label={`${method.name} adı`}
                onBlur={(event) => updateMethod(method.id, { name: event.target.value })}
              />
              <div className="mt-2 flex gap-2">
                <input
                  className="field"
                  defaultValue={method.code}
                  aria-label={`${method.name} kodu`}
                  onBlur={(event) => updateMethod(method.id, { code: event.target.value })}
                />
                <select
                  className="field"
                  defaultValue={method.type}
                  onChange={(event) =>
                    updateMethod(method.id, { type: event.target.value as MethodType })
                  }
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
                className="mt-2 text-sm text-ink-muted"
                onClick={() => deleteMethod(method.id)}
                disabled={state.methods.length <= 1}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2">
          <input
            className="field"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Yöntem adı"
          />
          <div className="flex gap-2">
            <input
              className="field"
              value={newCode}
              onChange={(event) => setNewCode(event.target.value.toUpperCase())}
              placeholder="Kod"
            />
            <select
              className="field"
              value={newType}
              onChange={(event) => setNewType(event.target.value as MethodType)}
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
              if (addMethod({ name: newName, code: newCode, type: newType })) {
                setNewName("");
                setNewCode("");
              }
            }}
          >
            Yöntem ekle
          </button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[15px] font-semibold">Kategoriler</h2>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-2">
              <input
                className="field"
                defaultValue={category.name}
                onBlur={(event) => updateCategory(category.id, event.target.value)}
              />
              <button type="button" className="text-ink-muted" onClick={() => moveCategory(category.id, -1)}>
                ↑
              </button>
              <button type="button" className="text-ink-muted" onClick={() => moveCategory(category.id, 1)}>
                ↓
              </button>
              <button
                type="button"
                className="text-sm text-ink-muted"
                onClick={() => deleteCategory(category.id)}
                disabled={state.categories.length <= 1}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="+ Yeni kategori"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (addCategory(newCategory)) setNewCategory("");
            }}
          >
            Ekle
          </button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[15px] font-semibold">Para birimi</h2>
        <div className="flex flex-wrap gap-2">
          {(["TRY", "EUR", "USD"] as CurrencyCode[]).map((code) => (
            <button
              key={code}
              type="button"
              className={state.settings.currency === code ? "chip chip-active" : "chip"}
              onClick={() => updateSettings({ currency: code })}
            >
              {code === "TRY" ? "₺ TRY" : code}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[15px] font-semibold">Tema</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["system", "Sistem"],
              ["light", "Açık"],
              ["dark", "Koyu"],
            ] as [ThemePreference, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={state.settings.theme === id ? "chip chip-active" : "chip"}
              onClick={() => updateSettings({ theme: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[15px] font-semibold">Harcama AI</h2>
        <p className="mb-3 text-sm leading-6 text-ink-muted">
          Öneriler ve içgörüler yalnızca bu cihazdaki kayıtlardan üretilir. Harcama verisi dışarı gönderilmez.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={state.settings.aiEnabled ? "chip chip-active" : "chip"}
            onClick={() => updateSettings({ aiEnabled: true })}
          >
            Açık
          </button>
          <button
            type="button"
            className={!state.settings.aiEnabled ? "chip chip-active" : "chip"}
            onClick={() => updateSettings({ aiEnabled: false })}
          >
            Kapalı
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label>
            <span className="mb-2 block text-[13px] text-ink-muted">İstek tavanı %</span>
            <input
              className="field tabular-nums"
              inputMode="numeric"
              defaultValue={state.settings.goals.wantMaxPct ?? ""}
              placeholder="30"
              onBlur={(event) => {
                const n = Number(event.target.value.replace(",", "."));
                updateSettings({
                  goals: {
                    ...state.settings.goals,
                    wantMaxPct: Number.isFinite(n) && n > 0 ? n : null,
                  },
                });
              }}
            />
          </label>
          <label>
            <span className="mb-2 block text-[13px] text-ink-muted">Lüks tavanı %</span>
            <input
              className="field tabular-nums"
              inputMode="numeric"
              defaultValue={state.settings.goals.luxuryMaxPct ?? ""}
              placeholder="10"
              onBlur={(event) => {
                const n = Number(event.target.value.replace(",", "."));
                updateSettings({
                  goals: {
                    ...state.settings.goals,
                    luxuryMaxPct: Number.isFinite(n) && n > 0 ? n : null,
                  },
                });
              }}
            />
          </label>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-2 text-[15px] font-semibold">Uygulama bilgileri</h2>
        <p className="text-sm leading-6 text-ink-muted">
          Harcama Defteri 1.3 — AI destekli kişisel harcama defteri. Kayıtlar cihazda kalır.
          Ay değiştirmek veriyi silmez.
        </p>
      </section>
    </main>
  );
}
