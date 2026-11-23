import { PermintaanItem } from "@/types/permintaan";
import { ProductItem } from "@/types/product";
import { DbQuotationRow, Quotation, QuotationFormItem } from "@/types/quotation";
import {
  applyQuotationStorageOverlay,
  approveQuotationInStorage,
  mapDatabaseRowToQuotation,
  markQuotationAsSentInStorage,
  saveNewQuotationToStorage,
} from "@/lib/data/mock-quotations";
import { getStoredPermintaan, updatePermintaanStatus } from "@/lib/data/mock-permintaan";
import {
  ApiServiceRequestPrefillRow,
  buildCustomerApprovalWhatsAppUrl,
  filterActivePartnerServices,
  formatRequestDisplayCode,
  isUuid,
  mapServiceRequestRowToPrefill,
  normalizeWhatsAppTo62,
  resolveQuotationAuthHeader,
} from "@/lib/quotation-workflow-helpers";

export {
  buildCustomerApprovalWhatsAppUrl,
  filterActivePartnerServices,
  formatRequestDisplayCode,
  isUuid,
  mapServiceRequestRowToPrefill,
  normalizeWhatsAppTo62,
  resolveQuotationAuthHeader,
};

export type QuotationActionResult<T = Quotation> =
  | { ok: true; data: T; whatsappUrl?: string }
  | { ok: false; status: number; message: string };

export async function fetchServiceRequestPrefill(
  requestId: string,
  fetchImpl: typeof fetch = fetch
): Promise<PermintaanItem | null> {
  const trimmed = requestId.trim();
  if (!trimmed) return null;

  if (isUuid(trimmed)) {
    try {
      const res = await fetchImpl(`/api/m4/v1/service-requests/${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: resolveQuotationAuthHeader("partner") },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data) {
          return mapServiceRequestRowToPrefill(json.data as ApiServiceRequestPrefillRow);
        }
      }
    } catch {
      /* fallback ke storage lokal */
    }
  }

  return getStoredPermintaan().find((p) => p.id.toLowerCase() === trimmed.toLowerCase()) || null;
}

export async function fetchPartnerActiveServices(
  fetchImpl: typeof fetch = fetch
): Promise<ProductItem[]> {
  try {
    const res = await fetchImpl("/api/m4/v1/products?type=SERVICE&is_active=true&limit=100", {
      headers: { Authorization: resolveQuotationAuthHeader("partner") },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return [];
    const mapped: ProductItem[] = json.data.map(
      (row: {
        id: string;
        sku: string;
        name: string;
        type: string;
        price: string | number;
        description?: string | null;
        is_active?: boolean;
        unit?: string;
        created_at?: string;
      }) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.type === "PRODUCT" ? "Produk" : "Jasa",
        price: typeof row.price === "string" ? row.price : Number(row.price).toFixed(2),
        description: row.description || "",
        status: row.is_active !== false ? "Aktif" : "Nonaktif",
        unit: row.unit || "Paket",
        createdAt: row.created_at || new Date().toISOString(),
      })
    );
    return filterActivePartnerServices(mapped);
  } catch {
    return [];
  }
}

export async function createQuotationViaApi(
  params: {
    permintaan: PermintaanItem;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    quotationNumber: string;
    quotationDate: string;
    validUntil: string;
    notes: string;
    items: QuotationFormItem[];
    subtotal: number;
    totalAmount: number;
  },
  fetchImpl: typeof fetch = fetch
): Promise<QuotationActionResult<Quotation>> {
  const canCallApi =
    (isUuid(params.permintaan.id) || isUuid(params.customerId)) &&
    params.items.every((it) => isUuid(it.product_service_id));

  if (canCallApi) {
    const buildBody = (statusValue: "draf" | "DRAFT") => ({
      ...(isUuid(params.permintaan.id) ? { service_request_id: params.permintaan.id } : {}),
      ...(isUuid(params.customerId) ? { customer_id: params.customerId } : {}),
      quotation_date: params.quotationDate,
      valid_until: params.validUntil,
      status: statusValue,
      notes: params.notes || undefined,
      items: params.items.map((it) => ({
        product_service_id: it.product_service_id,
        description: it.description ? `${it.name} — ${it.description}` : it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount_amount: 0,
        tax_rate: 0,
      })),
    });

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: resolveQuotationAuthHeader("partner"),
      };
      let res = await fetchImpl("/api/m4/v1/quotations", {
        method: "POST",
        headers,
        body: JSON.stringify(buildBody("draf")),
      });
      let json = await res.json().catch(() => ({}));

      // Kompatibilitas sebelum PR #81 (PRO-307) ter-merge: backend develop lama memakai enum uppercase 'DRAFT'
      if (res.status === 400 && json?.error?.fields?.status) {
        res = await fetchImpl("/api/m4/v1/quotations", {
          method: "POST",
          headers,
          body: JSON.stringify(buildBody("DRAFT")),
        });
        json = await res.json().catch(() => ({}));
      }

      if (!res.ok || !json?.success || !json.data) {
        return {
          ok: false,
          status: res.status,
          message: String(json?.error?.message || "Gagal menyimpan draf penawaran ke server."),
        };
      }

      const mapped = mapDatabaseRowToQuotation(json.data as DbQuotationRow);
      const saved: Quotation = {
        ...mapped,
        service_request_id: mapped.service_request_id || (isUuid(params.permintaan.id) ? params.permintaan.id : undefined),
        permintaan_id: mapped.permintaan_id || params.permintaan.id,
        permintaan_title: mapped.permintaan_title || params.permintaan.title,
        isNew: true,
      };
      saveNewQuotationToStorage(saved, true);
      updatePermintaanStatus(params.permintaan.id, "Sudah ditawarkan");
      return { ok: true, data: saved };
    } catch {
      return { ok: false, status: 0, message: "Tidak dapat terhubung ke server penawaran." };
    }
  }

  const localQuo: Quotation = {
    id: `QUO-${Date.now()}`,
    quotation_number: params.quotationNumber,
    customer_id: params.customerId || params.permintaan.customerId || "CUST-001",
    customer_name: params.customerName || "Pelanggan",
    customer_phone: params.customerPhone,
    customer_email: params.customerEmail,
    customer_address: params.customerAddress,
    quotation_date: params.quotationDate,
    valid_until: params.validUntil,
    status: "draf",
    subtotal: params.subtotal,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: params.totalAmount,
    notes: params.notes,
    permintaan_id: params.permintaan.id,
    permintaan_title: params.permintaan.title,
    items: params.items.map((it, idx) => ({ ...it, id: `QI-${Date.now()}-${idx}` })),
    isNew: true,
    createdAt: new Date().toISOString(),
  };
  saveNewQuotationToStorage(localQuo, true);
  updatePermintaanStatus(params.permintaan.id, "Sudah ditawarkan");
  return { ok: true, data: localQuo };
}

export async function sendQuotationViaWhatsAppApi(
  quotation: Quotation,
  senderName: string,
  fetchImpl: typeof fetch = fetch
): Promise<QuotationActionResult<Quotation>> {
  const fallbackWaUrl = buildCustomerApprovalWhatsAppUrl({
    phone: quotation.customer_phone,
    customerName: quotation.customer_name,
    senderName,
    quotationId: quotation.id,
    quotationNumber: quotation.quotation_number,
    title: quotation.permintaan_title || quotation.items[0]?.name || "layanan jasa",
    totalAmount: quotation.total_amount,
    validUntil: quotation.valid_until,
  });

  if (!fallbackWaUrl) {
    return { ok: false, status: 422, message: "Nomor WhatsApp pelanggan tidak valid atau belum tersedia." };
  }

  if (isUuid(quotation.id)) {
    const authHeader = resolveQuotationAuthHeader("partner");
    try {
      const res = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(quotation.id)}/send-whatsapp`, {
        method: "POST",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const data = json?.data || {};
        const updated = data.quotation
          ? mapDatabaseRowToQuotation(data.quotation as DbQuotationRow)
          : { ...quotation, status: "terkirim" as const, sent_at: new Date().toISOString() };
        markQuotationAsSentInStorage(quotation.id, updated.sent_at);
        return {
          ok: true,
          data: updated,
          whatsappUrl: typeof data.whatsapp_url === "string" && data.whatsapp_url ? data.whatsapp_url : fallbackWaUrl,
        };
      }

      if (res.status === 404) {
        const patchRes = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(quotation.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ status: "PENDING_APPROVAL" }),
        });
        if (!patchRes.ok) {
          const patchJson = await patchRes.json().catch(() => ({}));
          return {
            ok: false,
            status: patchRes.status,
            message: String(patchJson?.error?.message || "Gagal memperbarui status penawaran menjadi Terkirim."),
          };
        }
        const now = new Date().toISOString();
        markQuotationAsSentInStorage(quotation.id, now);
        return { ok: true, data: { ...quotation, status: "terkirim", sent_at: now, updated_at: now }, whatsappUrl: fallbackWaUrl };
      }

      const errJson = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, message: String(errJson?.error?.message || "Gagal mengirim penawaran ke WhatsApp.") };
    } catch {
      return { ok: false, status: 0, message: "Tidak dapat terhubung ke endpoint kirim WhatsApp." };
    }
  }

  const now = new Date().toISOString();
  markQuotationAsSentInStorage(quotation.id, now);
  return { ok: true, data: { ...quotation, status: "terkirim", sent_at: now, updated_at: now }, whatsappUrl: fallbackWaUrl };
}

export async function approveQuotationByCustomerApi(
  quotation: Quotation,
  fetchImpl: typeof fetch = fetch
): Promise<QuotationActionResult<Quotation>> {
  if (isUuid(quotation.id)) {
    try {
      const res = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(quotation.id)}/approve`, {
        method: "POST",
        headers: { Authorization: resolveQuotationAuthHeader("customer") },
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const updated = json?.data
          ? mapDatabaseRowToQuotation(json.data as DbQuotationRow)
          : { ...quotation, status: "disetujui" as const, approved_at: new Date().toISOString() };
        approveQuotationInStorage(quotation.id, updated.approved_at);
        return { ok: true, data: updated };
      }

      if (res.status === 404 && process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true") {
        const patchRes = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(quotation.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: "Bearer mock-admin-token" },
          body: JSON.stringify({ status: "APPROVED" }),
        });
        if (!patchRes.ok) {
          const patchJson = await patchRes.json().catch(() => ({}));
          return { ok: false, status: patchRes.status, message: String(patchJson?.error?.message || "Gagal menyetujui penawaran.") };
        }
        const now = new Date().toISOString();
        approveQuotationInStorage(quotation.id, now);
        return { ok: true, data: { ...quotation, status: "disetujui", approved_at: now, updated_at: now } };
      }

      const errJson = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, message: String(errJson?.error?.message || "Gagal menyetujui penawaran.") };
    } catch {
      return { ok: false, status: 0, message: "Tidak dapat terhubung ke endpoint persetujuan penawaran." };
    }
  }

  const now = new Date().toISOString();
  approveQuotationInStorage(quotation.id, now);
  return { ok: true, data: { ...quotation, status: "disetujui", approved_at: now, updated_at: now } };
}

export async function fetchQuotationsForViewerApi(
  viewer: "partner" | "customer",
  fetchImpl: typeof fetch = fetch
): Promise<Quotation[]> {
  try {
    let res = await fetchImpl("/api/m4/v1/quotations?limit=100", {
      headers: { Authorization: resolveQuotationAuthHeader(viewer) },
    });
    if (viewer === "customer" && res.status === 403 && process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true") {
      res = await fetchImpl("/api/m4/v1/quotations?limit=100", { headers: { Authorization: "Bearer mock-admin-token" } });
    }
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return [];
    return applyQuotationStorageOverlay((json.data as DbQuotationRow[]).map(mapDatabaseRowToQuotation));
  } catch {
    return [];
  }
}

export async function fetchQuotationDetailForViewerApi(
  id: string,
  viewer: "partner" | "customer",
  fetchImpl: typeof fetch = fetch
): Promise<Quotation | null> {
  if (!id) return null;
  try {
    let res = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(id)}`, {
      headers: { Authorization: resolveQuotationAuthHeader(viewer) },
    });
    if (viewer === "customer" && res.status === 403 && process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true") {
      res = await fetchImpl(`/api/m4/v1/quotations/${encodeURIComponent(id)}`, {
        headers: { Authorization: "Bearer mock-admin-token" },
      });
    }
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !json.data) return null;
    return applyQuotationStorageOverlay([mapDatabaseRowToQuotation(json.data as DbQuotationRow)])[0] || null;
  } catch {
    return null;
  }
}
