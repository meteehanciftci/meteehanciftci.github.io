"use client";

import Link from "next/link";
import { ChartNoAxesCombined, CirclePlus, Home, ReceiptText, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useExpenseSheet } from "./ExpenseSheetContext";

const left = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/liste", label: "Harcamalar", icon: ReceiptText },
] as const;

const right = [
  { href: "/ozet", label: "Analiz", icon: ChartNoAxesCombined },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const { openAdd } = useExpenseSheet();

  return (
    <nav aria-label="Ana menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color:var(--white)]">
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-[env(safe-area-inset-bottom)]">
        {left.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex flex-col items-center justify-end pb-1">
          <button type="button" className="nav-plus press" onClick={openAdd} aria-label="Harcama ekle">
            <Icon icon={CirclePlus} size={22} />
          </button>
          <span className="mt-0.5 text-[10px] font-medium">Ekle</span>
        </li>
        {right.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[10px] ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon icon={icon} size={22} />
        {label}
      </Link>
    </li>
  );
}
