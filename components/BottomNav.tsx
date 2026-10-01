"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseSheet } from "./ExpenseSheetContext";

const items = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/liste", label: "Harcamalar" },
  { href: "/ozet", label: "Analiz" },
  { href: "/ayarlar", label: "Ayarlar" },
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
        {items.slice(0, 2).map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex justify-center">
          <button type="button" className="nav-plus" onClick={openAdd} aria-label="Harcama ekle">
            +
          </button>
        </li>
        {items.slice(2).map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-14 items-center justify-center whitespace-nowrap px-0.5 text-[10px] tracking-tight ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    </li>
  );
}
