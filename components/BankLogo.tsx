"use client";

import { useState } from "react";
import { VERIFIED_LOGO_KEYS } from "@/lib/banks/catalog";
import { initialsFromName } from "@/lib/text";
import type { Bank } from "@/lib/types";

type Size = "row" | "picker" | "manage";

const SIZES: Record<Size, string> = {
  row: "h-7 w-7",
  picker: "h-9 w-9",
  manage: "h-10 w-10",
};

export function BankLogo({
  bank,
  size = "row",
  decorative = true,
}: {
  bank?: Bank | null;
  size?: Size;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const label = bank?.name ?? "Nakit";
  const logoKey = bank?.logoKey;
  const showImage = Boolean(logoKey && VERIFIED_LOGO_KEYS.has(logoKey) && !failed);

  return (
    <span
      className={`logo-plate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${SIZES[size]}`}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/banks/${logoKey}.svg`}
          alt=""
          className="max-h-[78%] max-w-[78%] object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-semibold tracking-wide text-ink">
          {bank ? initialsFromName(bank.name) : "N"}
        </span>
      )}
    </span>
  );
}
