"use client";

type Point = { label: string; value: number };

export function LineChart({ points, onPick }: { points: Point[]; onPick?: (label: string) => void }) {
  const width = 320;
  const height = 120;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : index * step;
    const y = height - 16 - (point.value / max) * (height - 28);
    return { ...point, x, y };
  });
  const d = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-28 w-full" role="img">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((point) => (
        <g key={point.label}>
          <circle
            cx={point.x}
            cy={point.y}
            r="5"
            className="fill-[var(--canvas)] stroke-current"
            strokeWidth="2"
            onClick={() => onPick?.(point.label)}
          />
        </g>
      ))}
    </svg>
  );
}

export function Segmented({
  parts,
  onPick,
}: {
  parts: { id: string; label: string; value: number; className: string }[];
  onPick?: (id: string) => void;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-line">
      {parts.map((part) =>
        part.value > 0 ? (
          <button
            key={part.id}
            type="button"
            className={`h-full ${part.className}`}
            style={{ width: `${(part.value / total) * 100}%` }}
            onClick={() => onPick?.(part.id)}
            aria-label={part.label}
          />
        ) : null,
      )}
    </div>
  );
}

export function HBars({
  rows,
  onPick,
  format = (value) => value.toLocaleString("tr-TR"),
}: {
  rows: { id: string; label: string; value: number }[];
  onPick?: (id: string) => void;
  format?: (value: number) => string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => (
        <li key={row.id}>
          <button type="button" className="w-full text-left" onClick={() => onPick?.(row.id)}>
            <span className="flex justify-between text-[14px]">
              <span>{row.label}</span>
              <span className="tabular-nums">{format(row.value)}</span>
            </span>
            <span className="mt-1 block h-2 rounded-full bg-line">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${(row.value / max) * 100}%` }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function StackedMonths({
  rows,
}: {
  rows: { label: string; need: number; want: number; luxury: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.need + row.want + row.luxury));
  return (
    <div className="mt-4 flex h-36 items-end gap-2">
      {rows.map((row) => {
        const total = row.need + row.want + row.luxury;
        const height = Math.max(4, (total / max) * 100);
        return (
          <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-col justify-end overflow-hidden rounded-md" style={{ height: `${height}%` }}>
              <span className="class-bar-luxury block w-full" style={{ height: `${total ? (row.luxury / total) * 100 : 0}%` }} />
              <span className="class-bar-want block w-full" style={{ height: `${total ? (row.want / total) * 100 : 0}%` }} />
              <span className="class-bar-need block w-full" style={{ height: `${total ? (row.need / total) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-ink-muted">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}
