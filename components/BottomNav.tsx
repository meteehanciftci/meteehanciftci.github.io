"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseSheet } from "./ExpenseSheetContext";

const items = [
  { href: "/", label: "Harcama", icon: BookIcon },
  { href: "/ozet", label: "Analiz", icon: SummaryIcon },
  { href: "/ayarlar", label: "Ayarlar", icon: SettingsIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return (
      pathname === "/" ||
      pathname.startsWith("/liste") ||
      pathname.startsWith("/ekle") ||
      pathname.startsWith("/duzenle")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const { openAdd } = useExpenseSheet();

  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-[color:var(--white)]/90 backdrop-blur-md"
    >
      <div className="relative mx-auto max-w-lg">
        <button
          type="button"
          onClick={openAdd}
          className="absolute -top-7 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-3xl font-light text-white shadow-lg"
          aria-label="Harcama ekle"
        >
          +
        </button>
        <ul className="grid grid-cols-3 px-2 pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] tracking-tight ${
                    active ? "font-semibold text-ink" : "font-medium text-ink-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon active={active} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 4.75h8.75A2.75 2.75 0 0 1 18 7.5v11.25H8.25A1.75 1.75 0 0 1 6.5 17V4.75Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
      />
      <path
        d="M6.5 4.75A1.75 1.75 0 0 0 4.75 6.5v10.75A1.75 1.75 0 0 0 6.5 19h11.5"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
      />
    </svg>
  );
}

function SummaryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 16.5V19M12 11v8M18 7v12"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path
        d="M12 4.5v1.6M12 17.9v1.6M19.5 12h-1.6M6.1 12H4.5M17.3 6.7l-1.1 1.1M7.8 16.2l-1.1 1.1M17.3 17.3l-1.1-1.1M7.8 7.8 6.7 6.7"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
