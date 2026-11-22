export const QUOTATION_TOAST_TYPE_KEY = "araya_show_quotation_toast";
export const QUOTATION_TOAST_NUMBER_KEY = "araya_show_quotation_toast_number";
export const DEFAULT_PPN_RATE = 11;

/**
 * Hitung PPN per baris dengan pembulatan Round-Half-Up berbasis integer (BigInt),
 * bebas kesalahan floating-point sesuai aturan finansial Modul 4 (PRO-48 / TC-M4US2-06).
 */
export function calculateLineTaxRupiah(
  lineNetRupiah: number,
  taxRatePercent = DEFAULT_PPN_RATE
): number {
  if (!Number.isFinite(lineNetRupiah) || lineNetRupiah <= 0) return 0;
  if (!Number.isFinite(taxRatePercent) || taxRatePercent <= 0) return 0;
  const netInt = BigInt(Math.round(lineNetRupiah));
  const rateScaled = BigInt(Math.round(taxRatePercent * 100));
  const denominator = BigInt(10000);
  const rounded = (netInt * rateScaled + denominator / BigInt(2)) / denominator;
  return Number(rounded);
}

/**
 * Akumulasi subtotal, PPN per baris (Round-Half-Up), dan grand total penawaran.
 */
export function calculateQuotationTaxSummary(
  items: ReadonlyArray<{ subtotal: number }>,
  taxRatePercent = DEFAULT_PPN_RATE
): { subtotal: number; taxAmount: number; totalAmount: number } {
  let subtotal = 0;
  let taxAmount = 0;
  for (const item of items) {
    const lineNet = Number.isFinite(item.subtotal) && item.subtotal > 0 ? Math.round(item.subtotal) : 0;
    subtotal += lineNet;
    taxAmount += calculateLineTaxRupiah(lineNet, taxRatePercent);
  }
  return {
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
  };
}

export type CanonicalQuotationStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED";

/**
 * Menormalkan status penawaran (baik enum uppercase backend maupun lowercase SRS)
 * ke 4 status kanonis: DRAFT, SENT, APPROVED, REJECTED.
 */
export function normalizeQuotationStatus(status?: string | null): CanonicalQuotationStatus {
  const lower = String(status || "").trim().toLowerCase();
  if (lower === "approved" || lower === "disetujui") return "APPROVED";
  if (lower === "draft" || lower === "draf") return "DRAFT";
  if (lower === "rejected" || lower === "ditolak") return "REJECTED";
  return "SENT";
}

export function getQuotationStatusLabel(
  status?: string | null
): "Draf" | "Terkirim" | "Disetujui" | "Ditolak" {
  const canonical = normalizeQuotationStatus(status);
  if (canonical === "APPROVED") return "Disetujui";
  if (canonical === "DRAFT") return "Draf";
  if (canonical === "REJECTED") return "Ditolak";
  return "Terkirim";
}

/**
 * Menurunkan kode permintaan (PMT-XXXX) dari nomor penawaran.
 * Format backend PNW-YYYYMM-XXXX dicek lebih dulu sebelum format ringkas PNW-XXXX.
 */
export function derivePermintaanIdFromQuotationNumber(
  quotationNumber?: string | null
): string | undefined {
  if (!quotationNumber) return undefined;
  const match =
    quotationNumber.match(/PNW-\d{6}-(\d+)/i) ||
    quotationNumber.match(/PNW-(\d+)/i);
  return match ? `PMT-${match[1].padStart(4, "0")}` : undefined;
}

/**
 * Parsing string nominal harga menjadi bilangan bulat Rupiah (Round-Half-Up)
 * tanpa aritmetika floating-point.
 */
export function parsePriceRupiah(rawPrice?: string | number | null): number {
  if (rawPrice === null || rawPrice === undefined) return 0;
  const cleaned = String(rawPrice).trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return 0;
  const [intPart, decPart = ""] = cleaned.split(".");
  const base = Number.parseInt(intPart, 10);
  if (!Number.isSafeInteger(base)) return 0;
  return decPart.length > 0 && Number.parseInt(decPart[0], 10) >= 5 ? base + 1 : base;
}

export function formatTanggalIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!Number.isFinite(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateValidUntil(dateStr: string, days = 14): string {
  if (!dateStr || !Number.isFinite(days)) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
  const [y, m, d] = parts;
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  const target = new Date(y, m - 1, d + days);
  if (!Number.isFinite(target.getTime())) return "";
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

/**
 * Format timestamp database (created_at / updated_at) ke teks waktu Indonesia (WIB).
 */
export function formatWaktuPembaruan(dateInput?: string | Date): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (!Number.isFinite(d.getTime())) return String(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  } catch {
    return "-";
  }
}

/**
 * Format jam singkat HH:mm dari timestamp valid; mengembalikan string kosong bila tidak valid.
 */
export function formatJamSingkat(dateInput?: string | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (!Number.isFinite(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Menghitung masa berlaku dan sisa hari aktif dari tanggal penawaran dan valid_until.
 */
export function hitungMasaBerlaku(quotationDateStr: string, validUntilStr?: string): {
  durasiHari: number;
  labelMasaBerlaku: string;
  sisaHariLabel: string;
} {
  const qDate = new Date(quotationDateStr);
  if (!Number.isFinite(qDate.getTime())) {
    return { durasiHari: 14, labelMasaBerlaku: "-", sisaHariLabel: "-" };
  }
  const vDate = validUntilStr
    ? new Date(validUntilStr)
    : new Date(qDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(vDate.getTime())) {
    return { durasiHari: 14, labelMasaBerlaku: "-", sisaHariLabel: "-" };
  }

  const diffMs = vDate.getTime() - qDate.getTime();
  const durasiHari = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const validUntilFormatted = formatTanggalIndo(vDate.toISOString().split("T")[0]);
  const labelMasaBerlaku = `${durasiHari} hari (hingga ${validUntilFormatted})`;

  const todayMs = typeof window === "undefined" ? vDate.getTime() : Date.now();
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
