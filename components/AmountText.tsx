"use client";

import { formatKurus } from "@/lib/money";
import { useStore } from "@/lib/store";

export function AmountText({
  kurus,
  className,
}: {
  kurus: number;
  className?: string;
}) {
  const { state } = useStore();
  const hidden = state.settings.hideAmounts;
  return (
    <span className={className} aria-label={hidden ? "Tutar gizli" : undefined}>
      {formatKurus(kurus, state.settings.currency, hidden)}
    </span>
  );
}
