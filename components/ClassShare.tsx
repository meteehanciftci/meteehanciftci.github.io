"use client";

import { CLASS_LABEL, type SpendClass } from "@/lib/types";

const ORDER: SpendClass[] = ["need", "want", "luxury"];

export function ClassMark({ value }: { value: SpendClass }) {
  return <span className={`class-pill class-${value}`}>{CLASS_LABEL[value]}</span>;
}

export function ClassShare({
  pct,
  amounts,
  currencyText,
  onSelect,
}: {
  pct: Record<SpendClass, number>;
  amounts: Record<SpendClass, number>;
  currencyText: (n: number) => string;
  onSelect?: (id: SpendClass) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] text-ink-muted">
        İhtiyaç %{Math.round(pct.need)} · İstek %{Math.round(pct.want)} · Lüks %{Math.round(pct.luxury)}
      </p>
      <div className="flex h-3 overflow-hidden rounded-full bg-line">
        {ORDER.map((id) =>
          pct[id] > 0 ? (
            <button
              key={id}
              type="button"
              className={`h-full class-bar-${id}`}
              style={{ width: `${pct[id]}%` }}
              onClick={() => onSelect?.(id)}
              aria-label={CLASS_LABEL[id]}
            />
          ) : null,
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect?.(id)}
            className="rounded-2xl border border-line bg-[color:var(--white)] px-3 py-3 text-left"
          >
            <p className="text-[12px] text-ink-muted">{CLASS_LABEL[id]}</p>
            <p className="mt-1 text-[15px] font-semibold tabular-nums">{currencyText(amounts[id])}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
