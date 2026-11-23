import { InvoiceRecord, OrderRecord, OrderStatus } from "@/types/invoice-order";
import {
  canCustomerViewRecord,
  evaluateOrderProcessGuard,
  normalizeInvoiceStatus,
} from "@/lib/invoice-order-helpers";
import {
  getStoredInvoices,
  getStoredOrders,
  markInvoicePaidInStore,
  updateOrderStatusInStore,
} from "@/lib/data/mock-invoices-orders";

function resolveAuthHeader(mode: "customer" | "partner"): string {
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

export async function fetchInvoicesForViewerApi(
  isCustomer: boolean,
  customerUserId: string,
  fetchImpl: typeof fetch = fetch
): Promise<InvoiceRecord[]> {
  const endpoint = isCustomer ? "/api/m4/v1/me/invoices?limit=100" : "/api/m4/v1/invoices?limit=100";
  try {
    const res = await fetchImpl(endpoint, {
      headers: { Authorization: resolveAuthHeader(isCustomer ? "customer" : "partner") },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as InvoiceRecord[];
      }
    }
  } catch {
    /* fallback ke store lokal tersinkronisasi sampai endpoint backend M4-US4 ter-merge */
  }

  const stored = getStoredInvoices();
  return isCustomer
    ? stored.filter((inv) => canCustomerViewRecord(inv.customer_user_id, customerUserId))
    : stored;
}

export async function fetchOrdersForViewerApi(
  isCustomer: boolean,
  customerUserId: string,
  fetchImpl: typeof fetch = fetch
): Promise<OrderRecord[]> {
  const endpoint = isCustomer ? "/api/m4/v1/me/orders?limit=100" : "/api/m4/v1/orders?limit=100";
  try {
    const res = await fetchImpl(endpoint, {
      headers: { Authorization: resolveAuthHeader(isCustomer ? "customer" : "partner") },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as OrderRecord[];
      }
    }
  } catch {
    /* fallback ke store lokal tersinkronisasi sampai endpoint backend M4-US5 ter-merge */
  }

  const stored = getStoredOrders();
  return isCustomer
    ? stored.filter((ord) => canCustomerViewRecord(ord.customer_user_id, customerUserId))
    : stored;
}

export type MidtransPaymentInitResult =
  | { mode: "snap"; snapToken: string; redirectUrl?: string }
  | { mode: "sandbox_fallback"; invoice: InvoiceRecord }
  | { mode: "error"; status: number; message: string };

/**
 * Menginisiasi transaksi Midtrans Snap melalui POST /api/m4/v1/invoices/[id]/payments (UC-07 / PRO-60).
 * Jika endpoint belum ter-merge (404), beralih ke modal Midtrans Sandbox untuk simulasi uji lokal.
 */
export async function initiateMidtransPaymentApi(
  invoice: InvoiceRecord,
  fetchImpl: typeof fetch = fetch
): Promise<MidtransPaymentInitResult> {
  if (normalizeInvoiceStatus(invoice.status) === "PAID") {
    return {
      mode: "error",
      status: 422,
      message: `Invoice ${invoice.invoice_number} sudah berstatus Lunas.`,
    };
  }

  try {
    const res = await fetchImpl(
      `/api/m4/v1/invoices/${encodeURIComponent(invoice.id)}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: resolveAuthHeader("customer"),
        },
        body: JSON.stringify({ invoice_id: invoice.id }),
      }
    );

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const snapToken = json?.data?.snap_token || json?.snap_token;
      const redirectUrl = json?.data?.redirect_url || json?.redirect_url;
      if (typeof snapToken === "string" && snapToken.trim()) {
        return {
          mode: "snap",
          snapToken: snapToken.trim(),
          redirectUrl: typeof redirectUrl === "string" ? redirectUrl : undefined,
        };
      }
      return { mode: "sandbox_fallback", invoice };
    }

    if (res.status === 404) {
      return { mode: "sandbox_fallback", invoice };
    }

    const errJson = await res.json().catch(() => ({}));
    return {
      mode: "error",
      status: res.status,
      message: String(errJson?.error?.message || "Gagal memulai sesi pembayaran Midtrans."),
    };
  } catch {
    return { mode: "sandbox_fallback", invoice };
  }
}

export type OrderStatusUpdateResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; status: number; message: string };

/**
 * Memperbarui progres Order Partner (UC-08 / PRO-66) dengan penegakan Guard U-01 & BR-09.
 */
export async function updatePartnerOrderStatusApi(
  order: OrderRecord,
  nextStatus: OrderStatus,
  actorLabel: string,
  fetchImpl: typeof fetch = fetch
): Promise<OrderStatusUpdateResult> {
  const guard = evaluateOrderProcessGuard(order);
  if (guard.isFinal) {
    return { ok: false, status: 422, message: guard.reason || "Order sudah selesai dan tidak dapat diubah." };
  }
  if (nextStatus === "diproses" && !guard.canProcess) {
    return {
      ok: false,
      status: 422,
      message:
        guard.reason ||
        "Invoice belum lunas. Order baru dapat diproses setelah pembayaran lunas (Aturan U-01).",
    };
  }
  if (nextStatus === "selesai" && !guard.canComplete) {
    return {
      ok: false,
      status: 422,
      message: "Order harus berstatus Diproses terlebih dahulu sebelum diselesaikan (BR-09).",
    };
  }

  try {
    const res = await fetchImpl(`/api/m4/v1/orders/${encodeURIComponent(order.id)}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: resolveAuthHeader("partner"),
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
      return { ok: true, order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() } };
    }

    if (res.status === 404) {
      const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
      return { ok: true, order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() } };
    }

    const errJson = await res.json().catch(() => ({}));
    return {
      ok: false,
      status: res.status,
      message: String(errJson?.error?.message || "Gagal memperbarui status order."),
    };
  } catch {
    const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
    return { ok: true, order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() } };
  }
}

export function completeSandboxInvoicePayment(
  invoiceId: string,
  paymentMethod: string
): InvoiceRecord | null {
  return markInvoicePaidInStore(invoiceId, paymentMethod);
}
