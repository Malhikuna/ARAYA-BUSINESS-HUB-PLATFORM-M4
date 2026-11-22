import { PermintaanItem } from "@/types/permintaan";
import { Quotation } from "@/types/quotation";
import {
  formatTanggalIndo,
  derivePermintaanIdFromQuotationNumber,
  normalizeQuotationStatus,
} from "@/lib/quotation-helpers";
import { formatRupiah } from "@/lib/format";

function normalizeCode(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/[\s|]+/)
    .filter(Boolean);
}

function tokenMatchesText(token: string, haystack: string, compactHaystack: string, digitsHaystack: string): boolean {
  if (haystack.includes(token)) return true;

  const compactToken = normalizeCode(token);
  if (compactToken.length > 0 && compactHaystack.includes(compactToken)) return true;

  // Hanya cocokkan nomor telepon/nominal jika token memang angka/simbol angka (hindari "".includes("") === true)
  const isNumericLike = /^[\d+.\-()]+$/.test(token);
  if (isNumericLike) {
    const digits = token.replace(/\D/g, "");
    if (digits.length > 0 && digitsHaystack.includes(digits)) return true;
  }

  return false;
}

/**
 * Pencarian tabel Permintaan: nomor (PMT-xxxx), nama permintaan, customer, jasa, WhatsApp, tanggal, status.
 */
export function matchesPermintaanQuery(item: PermintaanItem, query: string): boolean {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true;

  const textParts = [
    item.id,
    item.title,
    item.customerName,
    item.serviceName,
    item.serviceCode,
    item.whatsapp,
    item.date,
    item.status,
    item.quotationNumber || "",
  ];
  const haystack = textParts.join(" ").toLowerCase();
  const compactHaystack = normalizeCode(`${item.id} ${item.quotationNumber || ""} ${item.serviceCode}`);
  const digitsHaystack = item.whatsapp.replace(/\D/g, "");

  return tokens.every((token) => tokenMatchesText(token, haystack, compactHaystack, digitsHaystack));
}

/**
 * Pencarian tabel Penawaran: nomor (PNW-xxxx), permintaan (PMT-xxxx & judul), customer, jasa, catatan, tanggal, total, status.
 */
export function matchesQuotationQuery(item: Quotation, query: string): boolean {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true;

  const derivedPmtId = item.permintaan_id || derivePermintaanIdFromQuotationNumber(item.quotation_number) || "";
  const canonicalStatus = normalizeQuotationStatus(item.status);
  const statusLabel =
    canonicalStatus === "APPROVED"
      ? "disetujui"
      : canonicalStatus === "DRAFT"
      ? "draf draft"
      : canonicalStatus === "REJECTED"
      ? "ditolak"
      : "terkirim";
  const itemsText = (item.items || []).map((it) => `${it.name} ${it.description || ""}`).join(" ");

  const textParts = [
    item.quotation_number,
    derivedPmtId,
    item.permintaan_title || "",
    item.customer_name,
    item.customer_phone || "",
    item.notes || "",
    itemsText,
    item.quotation_date,
    formatTanggalIndo(item.quotation_date),
    item.valid_until ? formatTanggalIndo(item.valid_until) : "",
    statusLabel,
    String(item.total_amount),
    formatRupiah(item.total_amount),
  ];
  const haystack = textParts.join(" ").toLowerCase();
  const compactHaystack = normalizeCode(`${item.quotation_number} ${derivedPmtId}`);
  const digitsHaystack = `${(item.customer_phone || "").replace(/\D/g, "")} ${String(Math.round(item.total_amount))}`;

  return tokens.every((token) => tokenMatchesText(token, haystack, compactHaystack, digitsHaystack));
}
