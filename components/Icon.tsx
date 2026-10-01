import type { LucideIcon } from "lucide-react";

export function Icon({
  icon: Glyph,
  size = 20,
}: {
  icon: LucideIcon;
  size?: 18 | 20 | 22 | 24;
}) {
  return <Glyph size={size} strokeWidth={1.75} aria-hidden />;
}
