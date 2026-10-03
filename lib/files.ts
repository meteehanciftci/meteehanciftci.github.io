import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { parseBackup } from "./backup";
import { readFileBackup, saveFileBackup } from "./storage";

export type BackupReceipt = {
  at: number;
  name: string;
  expenses: number;
  categories: number;
  methods: number;
};

export type SaveResult =
  | { ok: true; receipt: BackupReceipt }
  | { ok: false; reason: "empty" | "invalid" | "mismatch" | "write" };

const STATUS_KEY = "harcama-last-backup";

export function readBackupStatus(): (BackupReceipt & { ok: true }) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BackupReceipt & { ok?: boolean };
    if (!parsed.ok || typeof parsed.expenses !== "number") return null;
    return parsed as BackupReceipt & { ok: true };
  } catch {
    return null;
  }
}

export type InspectResult =
  | { ok: false; reason: "empty" | "invalid" | "mismatch" }
  | { ok: true; expenses: number; categories: number; methods: number };

export function inspectBackupText(content: string, expectedExpenses: number): InspectResult {
  if (!content || content.trim().length < 20) return { ok: false, reason: "empty" };
  const parsed = parseBackup(content);
  if (!parsed.ok) return { ok: false, reason: "invalid" };
  if (parsed.state.expenses.length !== expectedExpenses) return { ok: false, reason: "mismatch" };
  return {
    ok: true,
    expenses: parsed.state.expenses.length,
    categories: parsed.state.categories.length,
    methods: parsed.state.paymentSources.length,
  };
}

function remember(receipt: BackupReceipt) {
  window.localStorage.setItem(STATUS_KEY, JSON.stringify({ ...receipt, ok: true }));
}

export async function writePermanentBackup(filename: string, content: string, expectedExpenses: number): Promise<SaveResult> {
  const inspected = inspectBackupText(content, expectedExpenses);
  if (!inspected.ok) return inspected;
  try {
    await saveFileBackup(filename, content);
    const stored = await readFileBackup();
    const again = inspectBackupText(stored?.text ?? "", expectedExpenses);
    if (!again.ok || stored?.name !== filename) return { ok: false, reason: "write" };

    if (Capacitor.isNativePlatform()) {
      const path = `backups/${filename}`;
      await Filesystem.mkdir({ path: "backups", directory: Directory.Data, recursive: true }).catch(() => undefined);
      await Filesystem.writeFile({
        path,
        data: content,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      const written = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
      const text = typeof written.data === "string" ? written.data : "";
      const onDisk = inspectBackupText(text, expectedExpenses);
      if (!onDisk.ok) return { ok: false, reason: "write" };
    }

    const receipt: BackupReceipt = {
      at: stored.at,
      name: filename,
      expenses: inspected.expenses,
      categories: inspected.categories,
      methods: inspected.methods,
    };
    remember(receipt);
    return { ok: true, receipt };
  } catch {
    return { ok: false, reason: "write" };
  }
}

export async function shareSavedBackup(): Promise<"shared" | "cancelled" | "missing"> {
  const stored = await readFileBackup();
  if (!stored?.text) return "missing";
  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob([stored.text], { type: "application/json" });
    if (blob.size < 20) return "missing";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = stored.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return "shared";
  }
  try {
    const path = `share/${stored.name}`;
    await Filesystem.mkdir({ path: "share", directory: Directory.Cache, recursive: true }).catch(() => undefined);
    await Filesystem.writeFile({
      path,
      data: stored.text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    const uri = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({ title: stored.name, url: uri.uri, dialogTitle: stored.name });
    return "shared";
  } catch {
    return "cancelled";
  }
}

export async function saveCsv(filename: string, content: string): Promise<boolean> {
  if (!content.includes("odeme_kaynagi") && !content.includes("yer")) return false;
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({
        path: `backups/${filename}`,
        data: content,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      const written = await Filesystem.readFile({
        path: `backups/${filename}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return typeof written.data === "string" && written.data.length === content.length;
    } catch {
      return false;
    }
  }
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  if (blob.size < 10) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
