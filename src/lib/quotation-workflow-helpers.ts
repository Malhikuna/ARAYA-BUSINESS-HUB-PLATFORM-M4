import { Customer } from "@/types/customer";
import { PermintaanItem } from "@/types/permintaan";
import { ProductItem } from "@/types/product";
import { initialCustomers, getStoredCustomers } from "@/lib/data/mock-customers";
import { initialProducts, getStoredProducts } from "@/lib/data/mock-products";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo } from "@/lib/quotation-helpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

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
 * Normalisasi nomor WhatsApp (08..., +62..., 62...) menjadi awalan 62 tanpa simbol non-digit.
 */
export function normalizeWhatsAppTo62(phone?: string | null): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
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

export function resolveQuotationAuthHeader(mode: "partner" | "customer"): string {
  const fallback = mode === "customer" ? "mock-customer-token" : "mock-partner-token";
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("araya_access_token");
      if (stored && stored.trim()) return `Bearer ${stored.trim()}`;
    } catch {
      /* ignore */
    }
  }
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
