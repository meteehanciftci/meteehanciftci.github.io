"use client";

type Props = {
  open: boolean;
  title: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  confirmLabel = "Sil",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Vazgeç"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl dark:bg-[#1c1c1e]"
      >
        <h2 id="confirm-title" className="text-[17px] font-semibold leading-snug">
          {title}
        </h2>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn-primary flex-1 !bg-[#b42318]"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
