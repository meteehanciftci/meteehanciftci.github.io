"use client";

import { PERIOD_LABEL } from "@/lib/format";
import type { Period } from "@/lib/types";

const ORDER: Period[] = ["7d", "30d", "this-month", "last-month", "3m", "6m", "1y", "all"];

export function PeriodPills({ value, onChange }: { value: Period; onChange: (next: Period) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={value === id ? "chip chip-active shrink-0" : "chip shrink-0"}
          onClick={() => onChange(id)}
        >
          {PERIOD_LABEL[id]}
        </button>
      ))}
    </div>
  );
}
