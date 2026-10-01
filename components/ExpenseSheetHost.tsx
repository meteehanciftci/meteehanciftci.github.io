"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenseSheet } from "./ExpenseSheetContext";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { useStore } from "@/lib/store";

export function ExpenseSheetHost() {
  const { addOpen, editing, close } = useExpenseSheet();
  const { addExpense, updateExpense, deleteExpense } = useStore();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Sheet
        open={addOpen}
        title={editing ? "Harcama" : "Harcama Ekle"}
        onClose={close}
      >
        <ExpenseForm
          key={editing?.id ?? "new"}
          expense={editing}
          onSubmit={(values) => {
            if (editing) {
              updateExpense(editing.id, values);
              showToast("Harcama kaydedildi.");
            } else {
              addExpense(values);
              showToast("Harcama kaydedildi.");
            }
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
          if (editing) {
            deleteExpense(editing.id);
            showToast("Harcama silindi.");
          }
          setConfirm(false);
          close();
        }}
      />
    </>
  );
}
