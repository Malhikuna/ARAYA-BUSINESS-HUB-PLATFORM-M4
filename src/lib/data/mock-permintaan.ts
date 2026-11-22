import { PermintaanItem } from "@/types/permintaan";
import { initialPermintaan } from "./mock-permintaan-data";
import { getFallbackPermintaan } from "./permintaan-fallback";

export { initialPermintaan };

const STORAGE_KEY = "araya_permintaan_list_v7";

function cloneInitialPermintaan(): PermintaanItem[] {
  return initialPermintaan.map((item) => ({ ...item }));
}

export function getStoredPermintaan(): PermintaanItem[] {
  if (typeof window === "undefined") return cloneInitialPermintaan();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return (parsed as PermintaanItem[]).map((item) => ({ ...item }));
      }
    }
  } catch {
    // ignore storage error
  }
  return cloneInitialPermintaan();
}

export function getNewPermintaanCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const list = getStoredPermintaan();
    return list.filter((i) => i.status === "Baru").length;
  } catch {
    return 0;
  }
}

export const getServerNewPermintaanCount = (): number => 0;

export function formatBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

export function savePermintaanToStorage(list: PermintaanItem[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("araya-permintaan-update"));
  } catch {
    // ignore storage error
  }
}

export function findPermintaanById(id: string): PermintaanItem | null {
  const list = getStoredPermintaan();
  const found = list.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (found) return found;
  const initialFound = initialPermintaan.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (initialFound) return initialFound;
  if (id.toUpperCase().startsWith("PMT-")) {
    return getFallbackPermintaan(id);
  }
  return null;
}

export function subscribePermintaanStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("araya-permintaan-update", callback);
  return () => {
    window.removeEventListener("araya-permintaan-update", callback);
  };
}

export function updatePermintaanStatus(id: string, newStatus: PermintaanItem["status"]): boolean {
  const list = [...getStoredPermintaan()];
  const index = list.findIndex((item) => item.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;
  list[index] = { ...list[index], status: newStatus };
  savePermintaanToStorage(list);
  return true;
}

