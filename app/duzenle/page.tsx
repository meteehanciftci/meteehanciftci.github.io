"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useExpenseSheet } from "@/components/ExpenseSheetContext";
import { useStore } from "@/lib/store";
import Link from "next/link";

function EditInner() {
  const id = useSearchParams().get("id");
  const { ledger } = useStore();
  const { openEdit } = useExpenseSheet();
  const expense = ledger.find((item) => item.id === id);

  useEffect(() => {
    if (expense) openEdit(expense);
  }, [expense, openEdit]);

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
  return <main className="px-5 pt-10 text-sm text-ink-muted">Düzenleniyor…</main>;
}

export default function EditPage() {
  return (
    <Suspense fallback={<main className="px-5 pt-10 text-sm text-ink-muted">Yükleniyor…</main>}>
      <EditInner />
    </Suspense>
  );
}
