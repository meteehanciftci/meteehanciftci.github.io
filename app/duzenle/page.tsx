"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useToast } from "@/components/Toast";
import { useStore } from "@/lib/store";

function EditExpense() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { state, updateExpense, deleteExpense } = useStore();
  const { showToast } = useToast();
  const expense = state.expenses.find((item) => item.id === id);

  if (!expense) {
    return (
      <main className="px-5 pt-10">
        <p className="text-sm text-ink-muted">Harcama bulunamadı.</p>
        <Link href="/liste" className="mt-4 inline-block text-sm font-medium">
          Listeye dön
        </Link>
      </main>
    );
  }

  return (
    <main className="px-5 pt-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/liste" className="text-sm text-ink-muted">
          Geri
        </Link>
        <h1 className="text-[17px] font-semibold">Harcama</h1>
        <span className="w-8" />
      </header>
      <ExpenseForm
        expense={expense}
        submitLabel="Kaydet"
        onSubmit={(values) => {
          updateExpense(expense.id, values);
          showToast("Harcama kaydedildi.");
          router.push("/liste");
        }}
        onDelete={() => {
          deleteExpense(expense.id);
          showToast("Harcama silindi.");
          router.push("/liste");
        }}
      />
    </main>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <main className="px-5 pt-10 text-sm text-ink-muted">Yükleniyor…</main>
      }
    >
      <EditExpense />
    </Suspense>
  );
}
