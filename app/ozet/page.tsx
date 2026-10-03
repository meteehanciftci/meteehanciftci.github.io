"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SummaryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <main className="px-5 pt-8 text-ink-muted">Deftere yönlendiriliyor…</main>;
}
