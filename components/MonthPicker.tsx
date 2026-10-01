"use client";

import { useMemo, useState } from "react";
import { expenseInMonth, formatMonthTitle, istanbulParts } from "@/lib/format";
import { shiftViewMonth, useViewMonth, setViewMonth } from "@/lib/view-month";
import { useStore } from "@/lib/store";
import { Sheet } from "./Sheet";

export function MonthPicker() {
  const view = useViewMonth();
  const { ledger } = useStore();
  const [open, setOpen] = useState(false);
  const now = istanbulParts();
  const [year, setYear] = useState(view.year);

  const years = useMemo(() => {
    const set = new Set<number>([now.year, now.year - 1, now.year - 2, view.year]);
    for (const expense of ledger) {
      const stamp = expense.expenseDate?.slice(0, 4);
      if (stamp) set.add(Number(stamp));
    }
    return [...set].filter((value) => Number.isFinite(value)).sort((a, b) => b - a);
  }, [ledger, now.year, view.year]);

  const title = view.all ? "Tüm aylar" : formatMonthTitle(view.year, view.month);

  return (
    <>
      <div className="flex items-center justify-between">
        <button type="button" className="nav-arrow" onClick={() => shiftViewMonth(-1)} aria-label="Önceki ay">
          ‹
        </button>
        <button type="button" className="month-title" onClick={() => { setYear(view.year); setOpen(true); }}>
          {title}
          <span aria-hidden> ▾</span>
        </button>
        <button type="button" className="nav-arrow" onClick={() => shiftViewMonth(1)} aria-label="Sonraki ay">
          ›
        </button>
      </div>
      <Sheet open={open} title="Dönem" onClose={() => setOpen(false)}>
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {years.map((item) => (
            <button
              key={item}
              type="button"
              className={year === item ? "chip chip-active shrink-0" : "chip shrink-0"}
              onClick={() => setYear(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <ul>
          {Array.from({ length: 12 }, (_, index) => 12 - index).map((month) => {
            const count = ledger.filter((expense) => expenseInMonth(expense, year, month)).length;
            const active = !view.all && view.year === year && view.month === month;
            return (
              <li key={month}>
                <button
                  type="button"
                  className="row-link"
                  onClick={() => {
                    setViewMonth({ year, month, all: false });
                    setOpen(false);
                  }}
                >
                  <span className={active ? "font-semibold" : ""}>{formatMonthTitle(year, month)}</span>
                  <span className="text-ink-muted">{count ? `${count} işlem` : "—"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="row-link mt-2"
          onClick={() => {
            setViewMonth({ year: now.year, month: now.month, all: true });
            setOpen(false);
          }}
        >
          <span>Tüm aylar</span>
          <span className="text-ink-muted">{ledger.length}</span>
        </button>
      </Sheet>
    </>
  );
}
