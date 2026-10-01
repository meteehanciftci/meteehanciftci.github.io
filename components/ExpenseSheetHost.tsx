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
  const { addOpen, editing, detail, openedAt, close, openEdit } = useExpenseSheet();
  const { addExpense, updateExpense, deleteExpense } = useStore();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const target = editing ?? detail;

  return (
    <>
      <Sheet open={Boolean(detail)} title="İşlem" onClose={close}>
        {detail ? (
          <ExpenseDetail
            expense={detail}
            onEdit={() => openEdit(detail)}
            onDelete={() => setConfirm(true)}
          />
        ) : null}
      </Sheet>
      <Sheet open={addOpen} title={editing ? "Düzenle" : "Yeni Harcama"} onClose={close}>
        <ExpenseForm
          key={editing?.id ?? `new-${openedAt}`}
          expense={editing}
          nowTs={openedAt}
          submitLabel={editing ? "Kaydet" : "Harcamayı Kaydet"}
          onSubmit={(values) => {
            if (editing) updateExpense(editing.id, values);
            else addExpense(values);
            showToast("Harcama kaydedildi.");
            close();
          }}
          onDelete={editing ? () => setConfirm(true) : undefined}
        />
      </Sheet>
      <ConfirmDialog
        open={confirm}
        title="Bu harcamayı silmek istediğinizden emin misiniz?"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (target) {
            deleteExpense(target.id);
            showToast("Harcama silindi.");
          }
          setConfirm(false);
          close();
        }}
      />
    </>
  );
}
