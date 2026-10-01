"use client";

import { useState } from "react";
import { useSortedMethods, useStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    state,
    addCategory,
    updateCategory,
    deleteCategory,
    addMethod,
    updateMethod,
    deleteMethod,
  } = useStore();
  const methods = useSortedMethods();
  const [newCategory, setNewCategory] = useState("");
  const [newMethod, setNewMethod] = useState("");

  return (
    <main className="px-5 pt-8">
      <p className="text-[13px] font-medium text-ink-muted">Ayarlar</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Defter</h1>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Kategoriler</h2>
        <ul className="space-y-2">
          {state.categories.map((category) => (
            <li key={category.id} className="flex gap-2">
              <input
                className="field"
                defaultValue={category.name}
                aria-label={`${category.name} adını düzenle`}
                onBlur={(event) => updateCategory(category.id, event.target.value)}
              />
              <button
                type="button"
                className="shrink-0 px-2 text-sm text-ink-muted"
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

      <section className="mt-12">
        <h2 className="mb-1 text-[15px] font-semibold">Ödeme yöntemleri</h2>
        <p className="mb-3 text-[13px] text-ink-muted">
          Sıra, son kullanıma göredir.
        </p>
        <ul className="space-y-2">
          {methods.map((method) => (
            <li key={method.id} className="flex gap-2">
              <input
                className="field"
                defaultValue={method.name}
                aria-label={`${method.name} adını düzenle`}
                onBlur={(event) => updateMethod(method.id, event.target.value)}
              />
              <button
                type="button"
                className="shrink-0 px-2 text-sm text-ink-muted"
                onClick={() => deleteMethod(method.id)}
                disabled={state.methods.length <= 1}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            value={newMethod}
            onChange={(event) => setNewMethod(event.target.value)}
            placeholder="Yeni yöntem"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (addMethod(newMethod)) setNewMethod("");
            }}
          >
            Ekle
          </button>
        </div>
      </section>
    </main>
  );
}
