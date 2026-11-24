import { Quotation, QuotationStatus, DbQuotationRow, DbQuotationItemRow } from "@/types/quotation";
import { initialQuotations } from "./mock-quotations-data";
import { initialPermintaan } from "./mock-permintaan-data";
import {
  QUOTATION_TOAST_TYPE_KEY,
  QUOTATION_TOAST_NUMBER_KEY,
  derivePermintaanIdFromQuotationNumber,
  normalizeQuotationStatus,
  getQuotationStatusLabel,
  parsePriceRupiah,
  formatTanggalIndo,
  getTodayDateStr,
  calculateValidUntil,
  formatWaktuPembaruan,
  formatJamSingkat,
  hitungMasaBerlaku,
} from "@/lib/quotation-helpers";

export {
  initialQuotations,
  QUOTATION_TOAST_TYPE_KEY,
  QUOTATION_TOAST_NUMBER_KEY,
  derivePermintaanIdFromQuotationNumber,
  normalizeQuotationStatus,
  getQuotationStatusLabel,
  parsePriceRupiah,
  formatTanggalIndo,
  getTodayDateStr,
  calculateValidUntil,
  formatWaktuPembaruan,
  formatJamSingkat,
  hitungMasaBerlaku,
};

const DEV_AUTH_HEADER = "Bearer mock-admin-token";

/**
 * Menghasilkan riwayat aktivitas dinamis berdasarkan status, timestamp, dan detail email pelanggan.
 */
export function getQuotationActivities(quotation: Quotation) {
  if (quotation.activities && quotation.activities.length > 0) {
    return quotation.activities;
  }

  const list = [];
  const fallbackDate = quotation.quotation_date || "";
  const updatedDate = quotation.updated_at ? new Date(quotation.updated_at) : new Date(fallbackDate);
  const createdDate =
    quotation.created_at || quotation.createdAt
      ? new Date(quotation.created_at || quotation.createdAt!)
      : new Date(fallbackDate);

  const updatedTime = formatJamSingkat(updatedDate) || "-";
  const sentTime = formatJamSingkat(quotation.sent_at ? new Date(quotation.sent_at) : updatedDate) || updatedTime;
  const approvedTime = formatJamSingkat(quotation.approved_at ? new Date(quotation.approved_at) : updatedDate) || updatedTime;
  const createdTime = formatJamSingkat(createdDate) || "-";
  const canonical = normalizeQuotationStatus(quotation.status);

  if (canonical === "APPROVED") {
    list.push({
      id: "ACT-APPROVE",
      title: "Penawaran disetujui",
      time: approvedTime,
      description: "",
      status: "completed" as const,
    });
  } else if (canonical === "REJECTED") {
    list.push({
      id: "ACT-REJECT",
      title: "Penawaran ditolak",
      time: updatedTime,
      description: "",
      status: "completed" as const,
    });
  }

  if (canonical !== "DRAFT") {
    list.push({
      id: "ACT-SEND",
      title: "Terkirim ke pelanggan",
      time: sentTime,
      description: quotation.customer_email
        ? `Penawaran dikirim ke ${quotation.customer_email}`
        : `Dokumen penawaran dikirim ke ${quotation.customer_name}`,
      status: "completed" as const,
    });
  }

  list.push({
    id: "ACT-CREATE",
    title: "Dokumen dibuat",
    time: createdTime,
    description: `Dibuat untuk ${quotation.customer_name} (${quotation.quotation_number}) melalui generator draf penjualan`,
    status: "completed" as const,
  });

  return list;
}

export function subscribeQuotationStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("araya-quotation-storage-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-quotation-storage-update", callback);
  };
}

export const QUOTATION_STORAGE_KEY_DELETED = "araya_deleted_quotations_v5";
export const QUOTATION_STORAGE_KEY_ADDED = "araya_added_quotations_v5";
export const QUOTATION_STORAGE_KEY_UPDATED = "araya_updated_quotations_v5";

export function applyQuotationStorageOverlay(baseList: Quotation[]): Quotation[] {
  if (typeof window === "undefined") return baseList;
  try {
    const deletedIds: string[] = JSON.parse(sessionStorage.getItem(QUOTATION_STORAGE_KEY_DELETED) || "[]");
    const addedList: Quotation[] = JSON.parse(sessionStorage.getItem(QUOTATION_STORAGE_KEY_ADDED) || "[]");
    const updatedMap: Record<string, Partial<Quotation>> = JSON.parse(sessionStorage.getItem(QUOTATION_STORAGE_KEY_UPDATED) || "{}");
    const merged = [
      ...addedList,
      ...baseList.filter((q) => !addedList.some((a) => a.id === q.id || a.quotation_number === q.quotation_number)),
    ];
    return merged
      .filter((q) => !deletedIds.includes(q.id) && !deletedIds.includes(q.quotation_number))
      .map((q) => {
        const patch = updatedMap[q.id] || updatedMap[q.quotation_number];
        return patch ? { ...q, ...patch } : q;
      });
  } catch {
    return baseList;
  }
}

export function getStoredQuotations(): Quotation[] {
  return applyQuotationStorageOverlay(initialQuotations);
}

export function getServerStoredQuotations(): Quotation[] {
  return initialQuotations;
}

export function findQuotationById(id: string): Quotation | null {
  const all = getStoredQuotations();
  return all.find((q) => q.id === id || q.quotation_number === id) || null;
}

export function mapDatabaseRowToQuotation(row: DbQuotationRow): Quotation {
  const linkedRequestId = row.service_request_id || row.service_requests?.id || undefined;
  const derivedPmtId = derivePermintaanIdFromQuotationNumber(row.quotation_number);
  const matchedPmt = derivedPmtId ? initialPermintaan.find((p) => p.id === derivedPmtId) : undefined;

  return {
    id: row.id,
    quotation_number: row.quotation_number,
    customer_id: row.customer_id,
    customer_name: row.customers?.name || "Pelanggan",
    customer_phone: row.customers?.phone,
    customer_email: row.customers?.email,
    customer_address: row.customers?.address,
    customer_user_id: row.customers?.user_id || row.service_requests?.customer_user_id || undefined,
    partner_name: row.partner?.name || row.partner_name || undefined,
    partner_phone: row.partner?.whatsapp || row.partner?.phone || row.partner_phone || undefined,
    quotation_date: row.quotation_date ? String(row.quotation_date).split("T")[0] : "",
    valid_until: row.valid_until ? String(row.valid_until).split("T")[0] : undefined,
    status: row.status as QuotationStatus,
    subtotal: Number(row.subtotal) || 0,
    discount_amount: Number(row.discount_amount) || 0,
    tax_amount: Number(row.tax_amount) || 0,
    total_amount: Number(row.total_amount) || 0,
    notes: row.notes || "",
    service_request_id: linkedRequestId,
    permintaan_id: linkedRequestId || derivedPmtId,
    permintaan_title: row.service_requests?.title || matchedPmt?.title || row.notes || "Layanan konsultasi & jasa",
    sent_at: row.sent_at || undefined,
    approved_at: row.approved_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: Array.isArray(row.quotation_items)
      ? row.quotation_items.map((it: DbQuotationItemRow) => ({
          id: it.id,
          product_service_id: it.product_service_id,
          name: it.description?.split(" — ")[0] || it.products_services?.name || "Item",
          description: it.description?.includes(" — ") ? it.description.split(" — ").slice(1).join(" — ") : undefined,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          subtotal: Number(it.subtotal) || 0,
          unit: it.products_services?.unit || "Paket",
          category: it.products_services?.type === "SERVICE" ? "Jasa" : "Produk",
        }))
      : [],
  };
}

export async function fetchQuotationDetailFromDatabase(id: string): Promise<Quotation | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/m4/v1/quotations/${id}`, { headers: { Authorization: DEV_AUTH_HEADER } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return applyQuotationStorageOverlay([mapDatabaseRowToQuotation(json.data)])[0] || null;
  } catch {
    return null;
  }
}

export async function fetchQuotationsListFromDatabase(): Promise<Quotation[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/m4/v1/quotations?limit=100", { headers: { Authorization: DEV_AUTH_HEADER } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.data)
      ? applyQuotationStorageOverlay(json.data.map(mapDatabaseRowToQuotation))
      : [];
  } catch {
    return [];
  }
}

export function saveNewQuotationToStorage(newQuo: Quotation, skipApiSync = false) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(QUOTATION_STORAGE_KEY_ADDED);
    const list: Quotation[] = raw ? JSON.parse(raw) : [];
    const updated = [newQuo, ...list.filter((x) => x.id !== newQuo.id && x.quotation_number !== newQuo.quotation_number)];
    sessionStorage.setItem(QUOTATION_STORAGE_KEY_ADDED, JSON.stringify(updated));
    sessionStorage.setItem(QUOTATION_TOAST_TYPE_KEY, "created");
    sessionStorage.setItem(QUOTATION_TOAST_NUMBER_KEY, newQuo.quotation_number);
    window.dispatchEvent(new Event("araya-quotation-storage-update"));

    if (!skipApiSync) {
      fetch("/api/m4/v1/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
        body: JSON.stringify({
          customer_id: newQuo.customer_id,
          quotation_date: newQuo.quotation_date,
          valid_until: newQuo.valid_until,
          notes: newQuo.notes,
          items: newQuo.items.map((it) => ({
            product_service_id: it.product_service_id,
            description: it.name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount_amount: 0,
            tax_rate: newQuo.tax_rate ?? (newQuo.tax_amount > 0 ? 11 : 0),
          })),
        }),
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function markQuotationAsSentInStorage(id: string, sentAt?: string) {
  if (typeof window === "undefined") return;
  try {
    const now = sentAt || new Date().toISOString();
    const updatedRaw = sessionStorage.getItem(QUOTATION_STORAGE_KEY_UPDATED);
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};
    updatedMap[id] = {
      ...(updatedMap[id] || {}),
      status: "terkirim" as QuotationStatus,
      sent_at: now,
      updated_at: now,
    };
    sessionStorage.setItem(QUOTATION_STORAGE_KEY_UPDATED, JSON.stringify(updatedMap));
    sessionStorage.setItem(QUOTATION_TOAST_TYPE_KEY, "sent");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));
  } catch {
    // ignore
  }
}

export function approveQuotationInStorage(id: string, approvedAt?: string) {
  if (typeof window === "undefined") return;
  try {
    const now = approvedAt || new Date().toISOString();
    const updatedRaw = sessionStorage.getItem(QUOTATION_STORAGE_KEY_UPDATED);
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};
    updatedMap[id] = {
      ...(updatedMap[id] || {}),
      status: "disetujui" as QuotationStatus,
      approved_at: now,
      updated_at: now,
    };
    sessionStorage.setItem(QUOTATION_STORAGE_KEY_UPDATED, JSON.stringify(updatedMap));
    sessionStorage.setItem(QUOTATION_TOAST_TYPE_KEY, "approved");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));
  } catch {
    // ignore
  }
}

export function deleteQuotationFromStorage(id: string, quotationNumber?: string) {
  if (typeof window === "undefined") return;
  try {
    const deletedList: string[] = JSON.parse(sessionStorage.getItem(QUOTATION_STORAGE_KEY_DELETED) || "[]");
    for (const key of [id, quotationNumber].filter((k): k is string => Boolean(k))) {
      if (!deletedList.includes(key)) deletedList.push(key);
    }
    sessionStorage.setItem(QUOTATION_STORAGE_KEY_DELETED, JSON.stringify(deletedList));
    const rawAdded = sessionStorage.getItem(QUOTATION_STORAGE_KEY_ADDED);
    if (rawAdded) {
      const addedList: Quotation[] = JSON.parse(rawAdded);
      sessionStorage.setItem(
        QUOTATION_STORAGE_KEY_ADDED,
        JSON.stringify(addedList.filter((q) => q.id !== id && q.quotation_number !== id && q.quotation_number !== quotationNumber))
      );
    }
    sessionStorage.setItem(QUOTATION_TOAST_TYPE_KEY, "deleted");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));
  } catch {
    // ignore
  }
}

export function saveUpdatedQuotationToStorage(updatedQuo: Quotation) {
  if (typeof window === "undefined") return;
  try {
    const updatedMap: Record<string, Partial<Quotation>> = JSON.parse(sessionStorage.getItem(QUOTATION_STORAGE_KEY_UPDATED) || "{}");
    const entry = { ...updatedQuo, updated_at: new Date().toISOString() };
    updatedMap[updatedQuo.id] = entry;
    updatedMap[updatedQuo.quotation_number] = entry;
    sessionStorage.setItem(QUOTATION_STORAGE_KEY_UPDATED, JSON.stringify(updatedMap));
    sessionStorage.setItem(QUOTATION_TOAST_TYPE_KEY, "updated");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));
  } catch {
    // ignore
  }
}

export function generateNextQuotationNumber(): string {
  if (typeof window === "undefined") return "PNW-0006";
  const all = getStoredQuotations();
  const maxNum = all.reduce((max, q) => {
    const match = q.quotation_number.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      return n > max ? n : max;
    }
    return max;
  }, 5);
  return `PNW-${String(maxNum + 1).padStart(4, "0")}`;
}

/**
 * Menghasilkan nomor penawaran PNW-XXXX dari ID permintaan.
 * Bila ID berasal dari backend (UUID / bukan format PMT-XXXX), fallback aman ke generator PNW-.
 */
export function generateQuotationNumberForPermintaan(permintaanId?: string | null): string {
  if (permintaanId && /^PMT-\d+$/i.test(permintaanId.trim())) {
    return permintaanId.trim().replace(/^PMT-/i, "PNW-");
  }
  return generateNextQuotationNumber();
}
