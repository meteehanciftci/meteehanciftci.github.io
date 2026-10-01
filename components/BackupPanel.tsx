"use client";

import { useEffect, useRef, useState } from "react";
import { buildBackup, mergeStates, parseBackup } from "@/lib/backup";
import { exportCsv } from "@/lib/export";
import { readBackupStatus, saveCsv, shareSavedBackup, writePermanentBackup, type BackupReceipt } from "@/lib/files";
import { listSnapshots, type Snapshot } from "@/lib/storage";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";

function formatWhen(at: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at));
}

export function BackupPanel() {
  const { state, importBackup } = useStore();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<BackupReceipt | null>(readBackupStatus());
  const [shareNote, setShareNote] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void listSnapshots().then((rows) => {
      if (live) setSnaps(rows);
    });
    return () => {
      live = false;
    };
  }, [status]);

  async function createBackup() {
    setBusy(true);
    setShareNote("");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const content = JSON.stringify(buildBackup(state), null, 2);
    const result = await writePermanentBackup(`harcama-defteri-${stamp}.json`, content, state.expenses.length);
    setBusy(false);
    if (!result.ok) {
      showToast("Yedek oluşturulamadı.");
      return;
    }
    setStatus(result.receipt);
    void listSnapshots().then(setSnaps);
  }

  async function shareFile() {
    const outcome = await shareSavedBackup();
    if (outcome === "cancelled") setShareNote("Paylaşım iptal edildi. Bu, yedek oluşturuldu demek değildir.");
    else if (outcome === "shared") setShareNote("");
    else showToast("Paylaşılacak yedek yok.");
  }

  async function exportCsvFile() {
    setBusy(true);
    const ok = await saveCsv(`harcama-defteri-${new Date().toISOString().slice(0, 10)}.csv`, exportCsv(state));
    setBusy(false);
    showToast(ok ? "CSV dosyası yazıldı." : "CSV oluşturulamadı.");
  }

  function onFile(file: File) {
    void file.text().then((text) => {
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        showToast(parsed.error);
        return;
      }
      setPending(parsed);
    });
  }

  function apply(mode: "merge" | "replace") {
    if (!pending || !pending.ok) return;
    importBackup(mode === "merge" ? mergeStates(state, pending.state) : pending.state);
    setPending(null);
    showToast(mode === "merge" ? "Yedek mevcut verilerle birleştirildi." : "Yedek geri yüklendi.");
  }

  return (
    <section className="mt-8">
      <h2 className="text-[13px] text-ink-muted">Veri ve yedekleme</h2>
      <button type="button" className="row-link" disabled={busy} onClick={() => void createBackup()}>
        Yedek oluştur
      </button>
      <button type="button" className="row-link" disabled={!status} onClick={() => void shareFile()}>
        Dosyayı paylaş
      </button>
      <button type="button" className="row-link" onClick={() => fileRef.current?.click()}>
        Yedeği geri yükle
      </button>
      <button type="button" className="row-link" disabled={busy} onClick={() => void exportCsvFile()}>
        CSV dışa aktar
      </button>
      {status ? (
        <div className="mt-4">
          <p className="text-[17px] font-semibold">Yedek hazır</p>
          <p className="mt-2 text-[15px]">{status.expenses} harcama</p>
          <p className="text-[15px]">{status.categories} kategori</p>
          <p className="text-[15px]">{status.methods} ödeme yöntemi</p>
          <p className="mt-1 text-[13px] text-ink-muted">{formatWhen(status.at)}</p>
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-ink-muted">Henüz dosya yedeği yok.</p>
      )}
      {shareNote ? <p className="mt-2 text-[13px] text-ink-muted">{shareNote}</p> : null}
      {snaps.length > 0 ? (
        <div className="mt-4">
        <h2 className="text-[13px] text-ink-muted">Otomatik kopyalar</h2>
          {snaps.map((snap) => (
            <button
              key={snap.at}
              type="button"
              className="row-link"
              onClick={() => {
                const parsed = parseBackup(JSON.stringify({ data: snap.state, createdAt: new Date(snap.at).toISOString(), backupVersion: 1 }));
                if (!parsed.ok) {
                  showToast("Bu yedek dosyası geçerli değil.");
                  return;
                }
                setPending(parsed);
              }}
            >
              <span>{snap.label}</span>
              <span className="text-ink-muted">Geri yükle</span>
            </button>
          ))}
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,text/plain"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      {pending && pending.ok ? (
        <div className="mt-4">
          <p className="text-[15px]">Bu yedekte {pending.state.expenses.length} harcama bulundu.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary w-full" onClick={() => apply("merge")}>
              Birleştir
            </button>
            <button type="button" className="btn-primary" onClick={() => apply("replace")}>
              Mevcut verilerin yerine kullan
            </button>
          </div>
          <button type="button" className="mt-2 text-[13px] text-ink-muted" onClick={() => setPending(null)}>
            Vazgeç
          </button>
        </div>
      ) : null}
    </section>
  );
}
