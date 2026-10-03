"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExpenseDetail } from "./ExpenseDetail";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenseSheet } from "./ExpenseSheetContext";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { useStore } from "@/lib/store";

export function ExpenseSheetHost() {
  const { addOpen, editing, detail, openedAt, close, openEdit, inlineDetail } = useExpenseSheet();
  const { addExpense, updateExpense, deleteExpense, undoDelete } = useStore();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const target = editing ?? detail;

  function remove(id: string) {
    const removed = deleteExpense(id);
    if (!removed) return;
    showToast("Harcama silindi.", {
      actionLabel: "Geri al",
      duration: 8000,
      onAction: () => {
        if (undoDelete()) showToast("Harcama geri alındı.");
      },
    });
  }

  return (
    <>
      <Sheet open={Boolean(detail) && !addOpen && !inlineDetail} title="Harcama" onClose={close}>
        {detail ? (
          <ExpenseDetail
            expense={detail}
            onEdit={() => openEdit(detail)}
            onDelete={() => setConfirm(true)}
          />
        ) : null}
      </Sheet>
      <Sheet open={addOpen} title={editing ? "Düzenle" : "Harcama ekle"} onClose={close}>
        <ExpenseForm
          key={editing?.id ?? `new-${openedAt}`}
          expense={editing}
          nowTs={openedAt}
          submitLabel={editing ? "Kaydet" : "Harcamayı kaydet"}
          onSubmit={(values) => {
            const saved = editing ? updateExpense(editing.id, values) : Boolean(addExpense(values));
            if (!saved) return false;
            showToast(editing ? "Harcama güncellendi." : "Harcama kaydedildi.");
            close();
            return true;
          }}
          onDelete={editing ? () => setConfirm(true) : undefined}
        />
      </Sheet>
      <ConfirmDialog
        open={confirm}
        title="Bu harcamayı silmek istediğinizden emin misiniz?"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (target) remove(target.id);
          setConfirm(false);
          close();
        }}
      />
    </>
  );
}
