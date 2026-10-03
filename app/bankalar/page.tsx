"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { groupUserSources, sourceIsUsed, userBankCount } from "@/lib/domain";
import { SOURCE_TYPE_LABEL } from "@/lib/types";
import { useStore } from "@/lib/store";
import { BankLogo } from "@/components/BankLogo";
import { PaymentSourceSheet } from "@/components/PaymentSourceSheet";

export default function BanksPage() {
  const router = useRouter();
  const { state, renameSource, archiveSource, setDefaultSource, reorderSource } = useStore();
  const [open, setOpen] = useState(false);
  const { cash, bankGroups, orphan } = groupUserSources(state.paymentSources, state.banks);
  const hasSources = state.paymentSources.length > 0;
  const bankCount = userBankCount(state.paymentSources, state.banks);

  return (
    <main className="px-5 pt-8 pb-10 md:px-8">
      <h1 className="text-[28px] font-semibold tracking-tight">Bankalar ve ödeme kaynakları</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-6 text-ink-muted">
        Burada yalnızca harcamanın nereden ödendiği tanımlanır. Bakiye, borç veya faiz gösterilmez.
      </p>
      <p className="mt-3 text-[13px] text-ink-muted">
        {bankCount} banka · {state.paymentSources.filter((source) => source.type === "cash").length ? "Nakit ayrı tutulur" : "Nakit eklenmemiş"}
      </p>

      <button type="button" className="btn-primary mt-6 max-w-sm" onClick={() => setOpen(true)}>
        Banka / ödeme kaynağı ekle
      </button>

      {!hasSources ? (
        <p className="mt-16 text-center text-[15px] text-ink-muted">
          Henüz ödeme kaynağı yok. Katalogdaki bankalar, siz bir kaynak ekleyene kadar burada listelenmez.
        </p>
      ) : (
        <div className="mt-10 space-y-8">
          {cash.length > 0 ? (
            <section className="rounded-[24px] border border-dashed border-line bg-[color:var(--white)] p-5">
              <div className="flex items-center gap-3">
                <BankLogo bank={null} size="manage" />
                <div>
                  <h2 className="text-[17px] font-semibold">Nakit</h2>
                  <p className="text-[13px] text-ink-muted">Banka değildir</p>
                </div>
              </div>
              <ul className="mt-3">
                {cash.map((source) => (
                  <SourceActions
                    key={source.id}
                    sourceId={source.id}
                    used={sourceIsUsed(source.id, state.expenses)}
                    onShow={() => router.push(`/?source=${source.id}`)}
                    onRename={(name) => renameSource(source.id, name)}
                    onDefault={() => setDefaultSource(source.id)}
                    onArchive={(archived) => archiveSource(source.id, archived)}
                    onMove={(dir) => reorderSource(source.id, dir)}
                    name={source.name}
                    meta={`${SOURCE_TYPE_LABEL[source.type]}${source.isDefault ? " · Varsayılan" : ""}${source.archived ? " · Arşivli" : ""}`}
                    archived={source.archived}
                    isDefault={source.isDefault}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {bankGroups.map((group) => (
            <section key={group.bank.id} className="rounded-[24px] border border-line bg-[color:var(--white)] p-5">
              <div className="flex items-center gap-3">
                <BankLogo bank={group.bank} size="manage" />
                <div>
                  <h2 className="text-[17px] font-semibold">{group.bank.name}</h2>
                  <p className="text-[13px] text-ink-muted">{group.sources.length} kaynak</p>
                </div>
              </div>
              <ul className="mt-3">
                {group.sources.map((source) => (
                  <SourceActions
                    key={source.id}
                    sourceId={source.id}
                    used={sourceIsUsed(source.id, state.expenses)}
                    onShow={() => router.push(`/?source=${source.id}`)}
                    onRename={(name) => renameSource(source.id, name)}
                    onDefault={() => setDefaultSource(source.id)}
                    onArchive={(archived) => archiveSource(source.id, archived)}
                    onMove={(dir) => reorderSource(source.id, dir)}
                    name={source.name}
                    meta={`${SOURCE_TYPE_LABEL[source.type]}${source.isDefault ? " · Varsayılan" : ""}${source.archived ? " · Arşivli" : ""}`}
                    archived={source.archived}
                    isDefault={source.isDefault}
                  />
                ))}
              </ul>
            </section>
          ))}

          {orphan.length > 0 ? (
            <section className="rounded-[24px] border border-line p-5">
              <h2 className="text-[17px] font-semibold">Banka atanmamış kaynaklar</h2>
              <ul className="mt-3">
                {orphan.map((source) => (
                  <SourceActions
                    key={source.id}
                    sourceId={source.id}
                    used={sourceIsUsed(source.id, state.expenses)}
                    onShow={() => router.push(`/?source=${source.id}`)}
                    onRename={(name) => renameSource(source.id, name)}
                    onDefault={() => setDefaultSource(source.id)}
                    onArchive={(archived) => archiveSource(source.id, archived)}
                    onMove={(dir) => reorderSource(source.id, dir)}
                    name={source.name}
                    meta={`${SOURCE_TYPE_LABEL[source.type]}${source.archived ? " · Arşivli" : ""}`}
                    archived={source.archived}
                    isDefault={source.isDefault}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <PaymentSourceSheet open={open} onClose={() => setOpen(false)} onSelect={() => setOpen(false)} />
    </main>
  );
}

function SourceActions({
  name,
  meta,
  archived,
  isDefault,
  used,
  onShow,
  onRename,
  onDefault,
  onArchive,
  onMove,
}: {
  sourceId: string;
  name: string;
  meta: string;
  archived: boolean;
  isDefault: boolean;
  used: boolean;
  onShow: () => void;
  onRename: (name: string) => void;
  onDefault: () => void;
  onArchive: (archived: boolean) => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <li className="border-t border-line py-3">
      <input
        className="field"
        defaultValue={name}
        aria-label={`${name} adı`}
        onBlur={(event) => onRename(event.target.value)}
      />
      <p className="mt-1 text-[13px] text-ink-muted">{meta}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="chip" onClick={onShow}>
          Harcamaları görüntüle
        </button>
        {!isDefault && !archived ? (
          <button type="button" className="chip" onClick={onDefault}>
            Varsayılan yap
          </button>
        ) : null}
        <button type="button" className="chip" onClick={() => onArchive(!archived)}>
          {archived ? "Arşivden çıkar" : used ? "Arşivle" : "Arşivle"}
        </button>
        <button type="button" className="chip" onClick={() => onMove(-1)}>
          Yukarı
        </button>
        <button type="button" className="chip" onClick={() => onMove(1)}>
          Aşağı
        </button>
      </div>
    </li>
  );
}
