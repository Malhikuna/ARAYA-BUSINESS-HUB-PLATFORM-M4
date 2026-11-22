import { PermintaanItem, PermintaanStatus } from "@/types/permintaan";

export interface DbServiceRequestQuotation {
  id: string;
  quotation_number: string;
  status: string;
  total_amount?: number | string | null;
}

export interface DbServiceRequestRow {
  id: string;
  partner_id: string;
  customer_id?: string | null;
  customer_user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  customers?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  quotations?: DbServiceRequestQuotation | null;
}

export interface SubmitM5ServiceRequestInput {
  partner_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  title: string;
  description?: string;
  serviceKey?: string;
}

export type SubmitM5ServiceRequestResult =
  | { ok: true; status: number; item: PermintaanItem; raw: DbServiceRequestRow }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      fields: Record<string, string> | null;
    };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

function deriveInitials(name: string): string {
  const clean = name.replace(/^(PT|CV|UD)\s+/i, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (clean.slice(0, 2) || "CS").toUpperCase();
}

function formatDateTimeWib(isoStr?: string): { date: string; time: string } {
  if (!isoStr) return { date: "-", time: "-" };
  const d = new Date(isoStr);
  if (!Number.isFinite(d.getTime())) return { date: "-", time: "-" };
  const date = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${hh}:${mm} WIB` };
}

/**
 * Memetakan baris tabel `service_requests` dari API `/api/m4/v1/service-requests`
 * ke struktur UI `PermintaanItem`.
 */
export function mapDbServiceRequestToPermintaan(row: DbServiceRequestRow): PermintaanItem {
  const normalizedRawStatus = String(row.status || "").trim().toLowerCase();
  const status: PermintaanStatus =
    normalizedRawStatus === "sudah_ditawarkan" ||
    normalizedRawStatus === "quoted" ||
    Boolean(row.quotations)
      ? "Sudah ditawarkan"
      : "Baru";

  const { date, time } = formatDateTimeWib(row.created_at);
  const shortCode = isUuid(row.id) ? `SR-${row.id.slice(0, 8).toUpperCase()}` : row.id;
  const customerName = row.customers?.name || row.customer_name || "Customer";
  const customerPhone = row.customers?.phone || row.customer_phone || "";
  const customerEmail = row.customers?.email || row.customer_email || "";

  return {
    id: row.id,
    displayCode: shortCode,
    ticketId: `#${shortCode}`,
    title: row.title,
    customerName,
    customerInitials: deriveInitials(customerName),
    customerAvatarBg: "bg-blue-100 text-blue-700",
    customerId: row.customer_id || row.customers?.id || undefined,
    customerEmail,
    whatsapp: customerPhone,
    serviceName: "Permintaan Jasa M5",
    serviceCode: shortCode,
    date,
    time,
    status,
    message: row.description?.trim() || row.title,
    source: "Katalog Jasa (Etalase M5)",
    scope: "Sesuai kebutuhan permintaan customer",
    contactPerson: customerName,
    contactRole: customerEmail || "Akun Customer M1",
    industry: customerEmail ? `Email: ${customerEmail}` : "Terdaftar melalui integrasi M5",
    createdAt: row.created_at,
    quotationId: row.quotations?.id,
    quotationNumber: row.quotations?.quotation_number,
  };
}

/**
 * Menggabungkan daftar permintaan dari API database dengan data lokal tanpa duplikasi ID.
 */
export function mergeServiceRequestsWithLocal(
  dbItems: PermintaanItem[],
  localItems: PermintaanItem[]
): PermintaanItem[] {
  const dbIds = new Set(dbItems.map((i) => i.id.toLowerCase()));
  return [...dbItems, ...localItems.filter((i) => !dbIds.has(i.id.toLowerCase()))];
}

/**
 * Membangun tautan tombol "Buat penawaran" sesuai kontrak PRO-310 / UC-03.
 */
export function buildCreateQuotationHref(item: Pick<PermintaanItem, "id">): string {
  return `/penawaran/tambah?request_id=${encodeURIComponent(item.id)}`;
}

/**
 * Menentukan tautan & label penawaran terkait saat permintaan sudah berstatus "Sudah ditawarkan".
 */
export function resolveLinkedQuotationLink(
  item: Pick<PermintaanItem, "id" | "quotationId" | "quotationNumber">
): { href: string; label: string } | null {
  if (item.quotationId || item.quotationNumber) {
    const target = item.quotationId || item.quotationNumber!;
    return {
      href: `/penawaran/lihat/${encodeURIComponent(target)}`,
      label: item.quotationNumber || "Penawaran terkait",
    };
  }
  if (/^PMT-\d+$/i.test(item.id)) {
    const derived = item.id.replace(/^PMT-/i, "PNW-");
    return {
      href: `/penawaran/lihat/${encodeURIComponent(derived)}`,
      label: derived,
    };
  }
  return null;
}

function resolveBearerHeader(fallbackToken: string): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("araya_access_token");
      if (stored && stored.trim()) return `Bearer ${stored.trim()}`;
    } catch {
      /* ignore */
    }
  }
  return `Bearer ${fallbackToken}`;
}

export async function fetchServiceRequestsFromApi(): Promise<PermintaanItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/m4/v1/service-requests?limit=100", {
      headers: { Authorization: resolveBearerHeader("mock-partner-token") },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return [];
    return (json.data as DbServiceRequestRow[]).map(mapDbServiceRequestToPermintaan);
  } catch {
    return [];
  }
}

export async function fetchServiceRequestByIdFromApi(id: string): Promise<PermintaanItem | null> {
  if (typeof window === "undefined" || !isUuid(id)) return null;
  try {
    const res = await fetch(`/api/m4/v1/service-requests/${encodeURIComponent(id)}`, {
      headers: { Authorization: resolveBearerHeader("mock-partner-token") },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !json.data) return null;
    return mapDbServiceRequestToPermintaan(json.data as DbServiceRequestRow);
  } catch {
    return null;
  }
}

/**
 * Mengirim simulasi permintaan jasa dari Form M5 ke POST /api/m4/v1/service-requests.
 */
export async function submitM5ServiceRequest(
  input: SubmitM5ServiceRequestInput
): Promise<SubmitM5ServiceRequestResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.serviceKey && input.serviceKey.trim()) {
    headers["X-Service-Key"] = input.serviceKey.trim();
  } else {
    headers["Authorization"] = resolveBearerHeader("mock-customer-token");
  }

  try {
    const res = await fetch("/api/m4/v1/service-requests", {
      method: "POST",
      headers,
      body: JSON.stringify({
        partner_id: input.partner_id.trim(),
        customer_name: input.customer_name.trim(),
        customer_email: input.customer_email.trim(),
        customer_phone: input.customer_phone.trim(),
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success || !json.data) {
      const errObj = json?.error && typeof json.error === "object" ? json.error : {};
      return {
        ok: false,
        status: res.status,
        code: String(errObj.code || "REQUEST_FAILED"),
        message: String(errObj.message || "Gagal mengirim permintaan jasa."),
        fields: errObj.fields && typeof errObj.fields === "object" ? errObj.fields : null,
      };
    }
    const raw = json.data as DbServiceRequestRow;
    return {
      ok: true,
      status: res.status,
      item: mapDbServiceRequestToPermintaan(raw),
      raw,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: "Tidak dapat terhubung ke endpoint POST /api/m4/v1/service-requests.",
      fields: null,
    };
  }
}
