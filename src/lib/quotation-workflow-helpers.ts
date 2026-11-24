import { Customer } from "@/types/customer";
import { PermintaanItem } from "@/types/permintaan";
import { ProductItem } from "@/types/product";
import { initialCustomers, getStoredCustomers } from "@/lib/data/mock-customers";
import { initialProducts, getStoredProducts } from "@/lib/data/mock-products";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo } from "@/lib/quotation-helpers";
import { normalizeWhatsAppDigits } from "@/components/permintaan/whatsapp-url";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const DEFAULT_QUOTATION_PPN_RATE = 11;

export interface ApiServiceRequestPrefillRow {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  title: string;
  description?: string | null;
  status: string;
  created_at?: string;
  customers?: { id?: string; name?: string; email?: string; phone?: string } | null;
  quotations?: { id?: string; quotation_number?: string; status?: string } | null;
}

export function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

export function formatRequestDisplayCode(id: string): string {
  return isUuid(id) ? `SR-${id.slice(0, 8).toUpperCase()}` : id;
}

/**
 * Normalisasi nomor WhatsApp (08..., 8..., +62..., 62...) menggunakan helper terpusat.
 */
export function normalizeWhatsAppTo62(phone?: string | null): string {
  return normalizeWhatsAppDigits(phone);
}

/**
 * Menghitung PPN per baris menggunakan pembulatan Round-Half-Up berbasis BigInt (NFR-04).
 */
export function calculateLinePpnRupiah(lineSubtotal: number, taxRate: number): number {
  if (lineSubtotal <= 0 || taxRate <= 0) return 0;
  const subtotalBig = BigInt(Math.round(lineSubtotal));
  const rateBasisPoints = BigInt(Math.round(taxRate * 100));
  const numerator = subtotalBig * rateBasisPoints + BigInt(5000);
  return Number(numerator / BigInt(10000));
}

/**
 * Menyusun tautan WhatsApp dari Customer ke Partner setelah penawaran disetujui (UC-05).
 * Mengembalikan null apabila nomor WhatsApp Partner belum tersedia/tidak valid.
 */
export function buildCustomerToPartnerWhatsAppUrl(params: {
  partnerPhone?: string | null;
  partnerName?: string;
  customerName: string;
  quotationNumber: string;
  title: string;
}): string | null {
  const normalizedPhone = normalizeWhatsAppTo62(params.partnerPhone);
  if (!normalizedPhone || normalizedPhone.length < 10) return null;
  const partnerGreeting = params.partnerName?.trim() || "Partner";
  const customerLabel = params.customerName.trim() || "Pelanggan";
  const message = `Halo ${partnerGreeting}, saya ${customerLabel}. Saya telah menyetujui penawaran ${params.quotationNumber} (${params.title}). Mohon informasi penerbitan invoice dan langkah pengerjaan selanjutnya. Terima kasih.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Menyusun tautan WhatsApp https://wa.me/62... berisi ringkasan penawaran & tautan persetujuan Customer.
 */
export function buildCustomerApprovalWhatsAppUrl(params: {
  phone?: string | null;
  customerName: string;
  senderName: string;
  quotationId: string;
  quotationNumber: string;
  title: string;
  totalAmount: number;
  validUntil?: string;
  origin?: string;
}): string | null {
  const normalizedPhone = normalizeWhatsAppTo62(params.phone);
  if (!normalizedPhone || normalizedPhone.length < 10) return null;

  const contactName =
    params.customerName.replace(/^(PT|CV|UD)\s+/i, "").split(" ")[0] ||
    params.customerName ||
    "Pelanggan";
  const validUntilStr = params.validUntil ? formatTanggalIndo(params.validUntil) : "-";
  const baseOrigin =
    params.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const detailUrl = `${baseOrigin}/penawaran/lihat/${encodeURIComponent(params.quotationId)}`;
  const message = `Halo ${contactName}, berikut penawaran ${params.quotationNumber} dari ${params.senderName} untuk ${params.title}. Total ${formatRupiah(params.totalAmount)}, berlaku sampai ${validUntilStr}. Lihat dan setujui di: ${detailUrl}`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Mengunci daftar katalog hanya untuk Jasa berstatus Aktif milik Partner (BR-13 & M4-US2-AC4).
 */
export function filterActivePartnerServices(products: ProductItem[]): ProductItem[] {
  return products.filter((p) => p.category === "Jasa" && p.status === "Aktif");
}

export function loadInitialQuotationCustomers(): Customer[] {
  try {
    const stored = getStoredCustomers();
    const parsed: Customer[] = typeof stored === "string" ? JSON.parse(stored) : stored;
    return Array.isArray(parsed) && parsed.length > 0
      ? [...initialCustomers, ...parsed.filter((p) => !initialCustomers.some((i) => i.id === p.id))]
      : initialCustomers;
  } catch {
    return initialCustomers;
  }
}

export function loadInitialActiveServices(): ProductItem[] {
  try {
    const parsed: ProductItem[] = JSON.parse(getStoredProducts());
    const merged =
      Array.isArray(parsed) && parsed.length > 0
        ? [...parsed, ...initialProducts.filter((i) => !parsed.some((p) => p.id === i.id))]
        : initialProducts;
    return filterActivePartnerServices(merged);
  } catch {
    return filterActivePartnerServices(initialProducts);
  }
}

export function resolveQuotationAuthHeader(
  mode: "partner" | "customer",
  options?: { allowMockFallback?: boolean; storedToken?: string | null }
): string | undefined {
  let token = options?.storedToken;
  if (token === undefined && typeof window !== "undefined") {
    try {
      token = localStorage.getItem("araya_access_token");
    } catch {
      token = null;
    }
  }
  if (token && token.trim()) return `Bearer ${token.trim()}`;
  const allowMock =
    options?.allowMockFallback ??
    (process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true" ||
      process.env.NODE_ENV !== "production");
  if (!allowMock) return undefined;
  const fallback = mode === "customer" ? "mock-customer-token" : "mock-partner-token";
  return `Bearer ${fallback}`;
}

export function mapServiceRequestRowToPrefill(row: ApiServiceRequestPrefillRow): PermintaanItem {
  const rawStatus = String(row.status || "").trim().toLowerCase();
  const isOffered = rawStatus === "sudah_ditawarkan" || rawStatus === "quoted" || Boolean(row.quotations?.id);
  const customerName = row.customers?.name || row.customer_name || "Customer";
  const customerPhone = row.customers?.phone || row.customer_phone || "";
  const customerEmail = row.customers?.email || row.customer_email || "";
  const clean = customerName.replace(/^(PT|CV|UD)\s+/i, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : (clean.slice(0, 2) || "CS").toUpperCase();
  const shortCode = formatRequestDisplayCode(row.id);

  let date = "-";
  let time = "-";
  if (row.created_at) {
    const d = new Date(row.created_at);
    if (Number.isFinite(d.getTime())) {
      date = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
      time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
    }
  }

  return {
    id: row.id,
    ticketId: `#${shortCode}`,
    title: row.title,
    customerName,
    customerInitials: initials,
    customerAvatarBg: "bg-blue-100 text-blue-700",
    customerId: row.customer_id || row.customers?.id || undefined,
    whatsapp: customerPhone,
    serviceName: "Permintaan Jasa M5",
    serviceCode: shortCode,
    date,
    time,
    status: isOffered ? "Sudah ditawarkan" : "Baru",
    message: row.description?.trim() || row.title,
    source: "Katalog Jasa (Etalase M5)",
    scope: "Sesuai kebutuhan permintaan customer",
    contactPerson: customerName,
    contactRole: customerEmail || "Akun Customer M1",
    industry: customerEmail ? `Email: ${customerEmail}` : "Terdaftar melalui integrasi M5",
    createdAt: row.created_at || new Date().toISOString(),
    quotationNumber: row.quotations?.quotation_number || row.quotations?.id,
  };
}
