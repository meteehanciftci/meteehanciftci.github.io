"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useToast } from "@/components/Toast";
import { useStore } from "@/lib/store";

export default function AddExpensePage() {
  const router = useRouter();
  const { addExpense } = useStore();
  const { showToast } = useToast();

  return (
    <main className="px-5 pt-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-muted">
          Geri
        </Link>
        <h1 className="text-[17px] font-semibold">Harcama Ekle</h1>
        <span className="w-8" />
      </header>
      <ExpenseForm
        submitLabel="Kaydet"
        onSubmit={(values) => {
          addExpense(values);
          showToast("Harcama kaydedildi.");
          router.push("/");
        }}
      />
    </main>
  );
}
