import {
  Bus,
  Clapperboard,
  Fuel,
  HeartPulse,
  House,
  MoreHorizontal,
  Plane,
  Repeat,
  Scissors,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Store,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "./Icon";

const MAP: { test: RegExp; icon: LucideIcon }[] = [
  { test: /market/i, icon: ShoppingBasket },
  { test: /yeme|yemek/i, icon: Utensils },
  { test: /yakıt|yakit/i, icon: Fuel },
  { test: /ulaşım|ulasim/i, icon: Bus },
  { test: /giyim|ayakkab/i, icon: Shirt },
  { test: /^ev$/i, icon: House },
  { test: /teknoloji/i, icon: Smartphone },
  { test: /sağlık|saglik/i, icon: HeartPulse },
  { test: /bakım|bakim/i, icon: Scissors },
  { test: /eğlence|eglence|hobi/i, icon: Clapperboard },
  { test: /abonelik/i, icon: Repeat },
  { test: /seyahat/i, icon: Plane },
  { test: /saat|aksesuar/i, icon: Store },
];

export function categoryGlyph(name?: string): LucideIcon {
  const found = MAP.find((item) => item.test.test(name ?? ""));
  return found?.icon ?? MoreHorizontal;
}

export function CategoryMark({ name, size = 18 }: { name?: string; size?: 18 | 20 }) {
  return (
    <span className="cat-mark">
      <Icon icon={categoryGlyph(name)} size={size} />
    </span>
  );
}
