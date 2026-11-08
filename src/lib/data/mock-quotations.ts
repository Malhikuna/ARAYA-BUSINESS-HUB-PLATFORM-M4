import { Quotation, QuotationStatus, DbQuotationRow, DbQuotationItemRow } from "@/types/quotation";
import { initialQuotations } from "./mock-quotations-data";

export { initialQuotations };

const DEV_AUTH_HEADER = "Bearer mock-admin-token";

export function formatTanggalIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp database (updated_at) ke format teks waktu Indonesia (WIB).
 */
export function formatWaktuPembaruan(dateInput?: string | Date): string {
  if (!dateInput) return "Baru saja";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  } catch {
    return "Baru saja";
  }
}

/**
 * Menghitung masa berlaku dan sisa hari aktif dari tanggal penawaran dan valid_until database.
 */
export function hitungMasaBerlaku(quotationDateStr: string, validUntilStr?: string): {
  durasiHari: number;
  labelMasaBerlaku: string;
  sisaHariLabel: string;
} {
  const qDate = new Date(quotationDateStr);
  const vDate = validUntilStr
    ? new Date(validUntilStr)
    : new Date(qDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  const diffMs = vDate.getTime() - qDate.getTime();
  const durasiHari = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const validUntilFormatted = formatTanggalIndo(vDate.toISOString().split("T")[0]);
  const labelMasaBerlaku = `${durasiHari} hari (hingga ${validUntilFormatted})`;

  const todayMs = Date.now();
  const sisaMs = vDate.getTime() - todayMs;
  const sisaHari = Math.ceil(sisaMs / (1000 * 60 * 60 * 24));

  let sisaHariLabel = `${durasiHari} hari`;
  if (sisaHari > 0) {
    sisaHariLabel = `${sisaHari} hari`;
  } else if (sisaHari === 0) {
    sisaHariLabel = "Hari terakhir";
  } else {
    sisaHariLabel = "Kedaluwarsa";
  }

  return { durasiHari, labelMasaBerlaku, sisaHariLabel };
}

/**
 * Menghasilkan riwayat aktivitas dinamis berdasarkan status, timestamp, dan detail email pelanggan.
 */
export function getQuotationActivities(quotation: Quotation) {
  if (quotation.activities && quotation.activities.length > 0) {
    return quotation.activities;
  }

  const list = [];
  const updatedDate = quotation.updated_at ? new Date(quotation.updated_at) : new Date();
  const createdDate = quotation.created_at || quotation.createdAt
    ? new Date(quotation.created_at || quotation.createdAt!)
    : new Date();

  const pad = (n: number) => String(n).padStart(2, "0");
  const updatedTime = `${pad(updatedDate.getHours())}:${pad(updatedDate.getMinutes())}`;
  const createdTime = `${pad(createdDate.getHours())}:${pad(createdDate.getMinutes())}`;

  if (quotation.status === "APPROVED") {
    list.push({
      id: "ACT-APPROVE",
      title: "Penawaran disetujui",
      time: "Baru saja",
      description: "",
      status: "completed" as const,
    });
  }

  list.push({
    id: "ACT-SEND",
    title: "Terkirim ke pelanggan",
    time: updatedTime,
    description: quotation.customer_email
      ? `Surel penawaran dikirim otomatis ke ${quotation.customer_email}`
      : `Dokumen penawaran dikirim ke ${quotation.customer_name}`,
    status: "completed" as const,
  });

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

export function getStoredQuotations(): Quotation[] {
  if (typeof window === "undefined") return initialQuotations;
  try {
    const raw = sessionStorage.getItem("araya_added_quotations");
    const addedList: Quotation[] = raw ? JSON.parse(raw) : [];

    const updatedRaw = sessionStorage.getItem("araya_updated_quotations");
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};

    const base = [
      ...addedList,
      ...initialQuotations.filter((q) => !addedList.some((a) => a.id === q.id || a.quotation_number === q.quotation_number)),
    ];
    return base.map((q) => (updatedMap[q.id] ? { ...q, ...updatedMap[q.id] } : q));
  } catch {
    return initialQuotations;
  }
}

export function getServerStoredQuotations(): Quotation[] {
  return initialQuotations;
}

export function findQuotationById(id: string): Quotation | null {
  const all = getStoredQuotations();
  return all.find((q) => q.id === id || q.quotation_number === id) || null;
}

function mapDatabaseRowToQuotation(row: DbQuotationRow): Quotation {
  return {
    id: row.id,
    quotation_number: row.quotation_number,
    customer_id: row.customer_id,
    customer_name: row.customers?.name || "Pelanggan",
    customer_phone: row.customers?.phone,
    customer_email: row.customers?.email,
    customer_address: row.customers?.address,
    quotation_date: row.quotation_date ? String(row.quotation_date).split("T")[0] : "",
    valid_until: row.valid_until ? String(row.valid_until).split("T")[0] : undefined,
    status: row.status as QuotationStatus,
    subtotal: Number(row.subtotal) || 0,
    discount_amount: Number(row.discount_amount) || 0,
    tax_amount: Number(row.tax_amount) || 0,
    total_amount: Number(row.total_amount) || 0,
    notes: row.notes || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: Array.isArray(row.quotation_items)
      ? row.quotation_items.map((it: DbQuotationItemRow) => ({
          id: it.id,
          product_service_id: it.product_service_id,
          name: it.products_services?.name || it.description || "Item",
          description: it.description || undefined,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          subtotal: Number(it.subtotal) || 0,
          unit: it.products_services?.unit || "Unit",
          category: it.products_services?.type === "SERVICE" ? "Jasa" : "Produk",
        }))
      : [],
  };
}

/**
 * Mengambil data detail penawaran langsung dari PostgreSQL via API M4.
 */
export async function fetchQuotationDetailFromDatabase(id: string): Promise<Quotation | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/m4/v1/quotations/${id}`, { headers: { Authorization: DEV_AUTH_HEADER } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? mapDatabaseRowToQuotation(json.data) : null;
  } catch {
    return null;
  }
}

/**
 * Mengambil daftar penawaran langsung dari PostgreSQL via API M4.
 */
export async function fetchQuotationsListFromDatabase(): Promise<Quotation[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/m4/v1/quotations?limit=100", { headers: { Authorization: DEV_AUTH_HEADER } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data.map(mapDatabaseRowToQuotation) : [];
  } catch {
    return [];
  }
}

export function saveNewQuotationToStorage(newQuo: Quotation) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem("araya_added_quotations");
    const list: Quotation[] = raw ? JSON.parse(raw) : [];
    const updated = [newQuo, ...list.filter((x) => x.id !== newQuo.id && x.quotation_number !== newQuo.quotation_number)];
    sessionStorage.setItem("araya_added_quotations", JSON.stringify(updated));
    sessionStorage.setItem("araya_show_quotation_toast", "created");
    sessionStorage.setItem("araya_quotation_toast_number", newQuo.quotation_number);
    window.dispatchEvent(new Event("araya-quotation-storage-update"));

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
          tax_rate: 0,
        })),
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function approveQuotationInStorage(id: string) {
  if (typeof window === "undefined") return;
  try {
    const updatedRaw = sessionStorage.getItem("araya_updated_quotations");
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};
    updatedMap[id] = {
      ...(updatedMap[id] || {}),
      status: "APPROVED" as QuotationStatus,
      updated_at: new Date().toISOString(),
    };
    sessionStorage.setItem("araya_updated_quotations", JSON.stringify(updatedMap));
    sessionStorage.setItem("araya_show_quotation_toast", "approved");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));

    fetch(`/api/m4/v1/quotations/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify({ status: "APPROVED" }),
    }).catch(() => {});
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
