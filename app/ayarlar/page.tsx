"use client";

import { useState } from "react";
import { BackupPanel } from "@/components/BackupPanel";
import { Icon } from "@/components/Icon";
import { useSortedCategories, useStore } from "@/lib/store";
import { APP_VERSION, APPLICATION_ID, VERSION_CODE } from "@/lib/version";
import { EyeOff, Info, Palette, Tags, Trash2 } from "lucide-react";
import type { ThemePreference } from "@/lib/types";

export default function SettingsPage() {
  const { state, addCategory, updateCategory, deleteCategory, moveCategory, updateSettings, wipeAll } = useStore();
  const categories = useSortedCategories();
  const [newCategory, setNewCategory] = useState("");
  const [wipeStep, setWipeStep] = useState(0);

  return (
    <main className="px-5 pt-8 pb-10 md:px-8">
      <h1 className="text-[28px] font-semibold tracking-tight">Ayarlar</h1>

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Icon icon={Palette} size={18} /> Görünüm
        </h2>
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

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Icon icon={EyeOff} size={18} /> Tutarları gizle
        </h2>
        <p className="mb-3 max-w-xl text-sm leading-6 text-ink-muted">
          Liste, toplamlar ve ayrıntılarda tutarlar gizlenir. Ekran okuyucu da tutarı okumaz.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={state.settings.hideAmounts ? "chip chip-active" : "chip"}
            onClick={() => updateSettings({ hideAmounts: true })}
          >
            Gizli
          </button>
          <button
            type="button"
            className={!state.settings.hideAmounts ? "chip chip-active" : "chip"}
            onClick={() => updateSettings({ hideAmounts: false })}
          >
            Görünür
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Icon icon={Tags} size={18} /> Kategoriler
        </h2>
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
            placeholder="Yeni kategori"
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

      <BackupPanel />

      <section className="mt-12">
        <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <Icon icon={Info} size={18} /> Uygulama
        </h2>
        <p className="text-sm leading-6 text-ink-muted">
          Denge {APP_VERSION} · derleme {VERSION_CODE}
          <br />
          {APPLICATION_ID}
          <br />
          Kayıtlar bu cihazda kalır. İnternet gerekmez.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <Icon icon={Trash2} size={18} /> Tüm verileri sil
        </h2>
        {wipeStep === 0 ? (
          <button type="button" className="btn-danger max-w-sm" onClick={() => setWipeStep(1)}>
            Tüm verileri sil
          </button>
        ) : null}
        {wipeStep === 1 ? (
          <div>
            <p className="mb-3 max-w-xl text-sm text-ink-muted">
              Harcamalar, kategoriler ve ödeme kaynakları silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setWipeStep(0)}>
                Vazgeç
              </button>
              <button type="button" className="btn-danger" onClick={() => setWipeStep(2)}>
                Evet, silmek istiyorum
              </button>
            </div>
          </div>
        ) : null}
        {wipeStep === 2 ? (
          <button
            type="button"
            className="btn-danger max-w-sm"
            onClick={() => {
              wipeAll();
              setWipeStep(0);
            }}
          >
            Silmeyi onayla
          </button>
        ) : null}
      </section>
    </main>
  );
}
