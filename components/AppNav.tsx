"use client";

import Link from "next/link";
import { BookOpen, Landmark, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const items = [
  { href: "/", label: "Defter", icon: BookOpen },
  { href: "/bankalar", label: "Bankalar", icon: Landmark },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      <nav
        aria-label="Ana menü"
        className="fixed inset-y-0 left-0 z-40 hidden w-52 border-r border-line bg-[color:var(--white)] pt-8 md:block"
      >
        <p className="px-5 text-[13px] font-medium tracking-[0.16em] text-ink-muted">DENGE</p>
        <ul className="mt-6 space-y-1 px-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`press flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] ${
                  isActive(pathname, item.href) ? "bg-canvas font-semibold text-ink" : "text-ink-muted"
                }`}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                <Icon icon={item.icon} size={20} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Ana menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color:var(--white)] md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-3 items-end px-1 pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                  isActive(pathname, item.href) ? "font-semibold text-ink" : "text-ink-muted"
                }`}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                <Icon icon={item.icon} size={22} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
