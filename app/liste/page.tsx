"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Redirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const next = new URLSearchParams();
    const cat = params.get("cat");
    const source = params.get("source") ?? params.get("method");
    const bank = params.get("bank");
    if (cat) next.set("cat", cat);
    if (source) next.set("source", source);
    if (bank) next.set("bank", bank);
    router.replace(next.size ? `/?${next}` : "/");
  }, [router, params]);
  return <main className="px-5 pt-8 text-ink-muted">Deftere yönlendiriliyor…</main>;
}

export default function ListRedirect() {
  return (
    <Suspense fallback={<main className="px-5 pt-8 text-ink-muted">Yükleniyor…</main>}>
      <Redirect />
    </Suspense>
  );
}
