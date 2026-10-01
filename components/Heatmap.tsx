"use client";

import { formatMoney } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

export function Heatmap({
  daysInMonth,
  mondayOffset,
  byDay,
  max,
  currency,
}: {
  daysInMonth: number;
  mondayOffset: number;
  byDay: Map<number, number>;
  max: number;
  currency: CurrencyCode;
}) {
  const cells: (number | null)[] = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-ink-muted">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const amount = day ? byDay.get(day) ?? 0 : 0;
          const intensity = day && amount ? Math.max(0.12, amount / max) : 0;
          return (
            <div
              key={index}
              className="flex aspect-square items-center justify-center rounded-lg text-[11px]"
              style={{
                background: day
                  ? `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--white))`
                  : "transparent",
                color: intensity > 0.55 ? "var(--canvas)" : "var(--ink)",
              }}
              title={day ? `${day}: ${formatMoney(amount, currency)}` : undefined}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
