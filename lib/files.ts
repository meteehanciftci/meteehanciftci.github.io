import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const STATUS_KEY = "harcama-last-backup";

export type BackupStatus = { at: number; ok: boolean; name: string };

export function readBackupStatus(): BackupStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as BackupStatus) : null;
  } catch {
    return null;
  }
}

function writeStatus(status: BackupStatus) {
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(status));
}

export async function saveExport(filename: string, content: string, mime: string): Promise<boolean> {
  if (!content) return false;
  try {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      const written = await Filesystem.readFile({
        path: filename,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      const text = typeof written.data === "string" ? written.data : "";
      if (!text.startsWith(content.slice(0, Math.min(24, content.length)))) return false;
      const uri = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      try {
        await Share.share({
          title: filename,
          url: uri.uri,
          dialogTitle: filename,
        });
      } catch {
        /* Dosya yazıldı; paylaşım penceresi kapanmış olabilir. */
      }
      writeStatus({ at: Date.now(), ok: true, name: filename });
      return true;
    }

    const blob = new Blob([content], { type: mime });
    if (blob.size < 2) return false;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    writeStatus({ at: Date.now(), ok: true, name: filename });
    return true;
  } catch {
    writeStatus({ at: Date.now(), ok: false, name: filename });
    return false;
  }
}
