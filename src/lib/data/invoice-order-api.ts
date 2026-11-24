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
import {
  mapApiInvoiceRowToRecord,
  mapApiOrderRowToRecord,
} from "@/lib/data/invoice-order-mappers";

export { mapApiInvoiceRowToRecord, mapApiOrderRowToRecord };

export interface ApiFallbackOptions {
  allowDevFallback?: boolean;
}

export function isLocalDevFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true";
}

function resolveAuthHeader(mode: "customer" | "partner", allowDevFallback: boolean): string | undefined {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("araya_access_token");
      if (stored && stored.trim()) return `Bearer ${stored.trim()}`;
    } catch {
      /* ignore */
    }
  }
  if (!allowDevFallback) return undefined;
  const fallback = mode === "customer" ? "mock-customer-token" : "mock-partner-token";
  return `Bearer ${fallback}`;
}

export async function fetchInvoicesForViewerApi(
  isCustomer: boolean,
  customerUserId: string,
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
): Promise<InvoiceRecord[]> {
  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const endpoint = isCustomer ? "/api/m4/v1/me/invoices?limit=100" : "/api/m4/v1/invoices?limit=100";
  const authHeader = resolveAuthHeader(isCustomer ? "customer" : "partner", allowDevFallback);
  try {
    const res = await fetchImpl(endpoint, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        const mapped = (json.data as unknown[]).map(mapApiInvoiceRowToRecord);
        if (mapped.length > 0 || !allowDevFallback) {
          return mapped;
        }
      }
    }
    if (!allowDevFallback) return [];
  } catch {
    if (!allowDevFallback) return [];
  }

  const stored = getStoredInvoices();
  return isCustomer
    ? stored.filter((inv) => canCustomerViewRecord(inv.customer_user_id, customerUserId))
    : stored;
}

export async function fetchOrdersForViewerApi(
  isCustomer: boolean,
  customerUserId: string,
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
): Promise<OrderRecord[]> {
  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const endpoint = isCustomer ? "/api/m4/v1/me/orders?limit=100" : "/api/m4/v1/orders?limit=100";
  const authHeader = resolveAuthHeader(isCustomer ? "customer" : "partner", allowDevFallback);
  try {
    const res = await fetchImpl(endpoint, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        const mapped = (json.data as unknown[]).map(mapApiOrderRowToRecord);
        if (mapped.length > 0 || !allowDevFallback) {
          return mapped;
        }
      }
    }
    if (!allowDevFallback) return [];
  } catch {
    if (!allowDevFallback) return [];
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
 * Fallback simulasi lokal (`sandbox_fallback`) dikunci ketat hanya untuk mode dev (`isDev`),
 * sedangkan di production (!isDev) wajib mengembalikan error jujur tanpa mutasi lokal.
 */
export async function initiateMidtransPaymentApi(
  invoice: InvoiceRecord,
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
): Promise<MidtransPaymentInitResult> {
  if (normalizeInvoiceStatus(invoice.status) === "PAID") {
    return {
      mode: "error",
      status: 422,
      message: `Invoice ${invoice.invoice_number} sudah berstatus Lunas.`,
    };
  }

  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const authHeader = resolveAuthHeader("customer", allowDevFallback);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers.Authorization = authHeader;

  try {
    const res = await fetchImpl(
      `/api/m4/v1/invoices/${encodeURIComponent(invoice.id)}/payments`,
      {
        method: "POST",
        headers,
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
      if (allowDevFallback) return { mode: "sandbox_fallback", invoice };
      return {
        mode: "error",
        status: 502,
        message: "Token pembayaran Midtrans Snap tidak ditemukan pada respons server.",
      };
    }

    if (res.status === 404 && allowDevFallback) {
      return { mode: "sandbox_fallback", invoice };
    }

    const errJson = await res.json().catch(() => ({}));
    return {
      mode: "error",
      status: res.status,
      message: String(errJson?.error?.message || "Gagal memulai sesi pembayaran Midtrans."),
    };
  } catch {
    if (allowDevFallback) return { mode: "sandbox_fallback", invoice };
    return {
      mode: "error",
      status: 0,
      message: "Tidak dapat terhubung ke server pembayaran Midtrans. Silakan coba lagi.",
    };
  }
}

export type OrderStatusUpdateResult =
  | { ok: true; order: OrderRecord; isLocalSimulation?: boolean }
  | { ok: false; status: number; message: string };

/**
 * Memperbarui progres Order Partner (UC-08 / PRO-66) dengan penegakan Guard U-01 & BR-09.
 * Mutasi mock lokal saat 404/network error dikunci ketat hanya untuk mode dev (`isDev`).
 */
export async function updatePartnerOrderStatusApi(
  order: OrderRecord,
  nextStatus: OrderStatus,
  actorLabel: string,
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
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

  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const authHeader = resolveAuthHeader("partner", allowDevFallback);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers.Authorization = authHeader;

  try {
    const res = await fetchImpl(`/api/m4/v1/orders/${encodeURIComponent(order.id)}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      if (json?.data && typeof json.data === "object") {
        return { ok: true, order: mapApiOrderRowToRecord(json.data) };
      }
      const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
      return { ok: true, order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() } };
    }

    if (res.status === 404 && allowDevFallback) {
      const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
      return {
        ok: true,
        order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() },
        isLocalSimulation: true,
      };
    }

    const errJson = await res.json().catch(() => ({}));
    return {
      ok: false,
      status: res.status,
      message: String(errJson?.error?.message || "Gagal memperbarui status order."),
    };
  } catch {
    if (allowDevFallback) {
      const updated = updateOrderStatusInStore(order.id, nextStatus, actorLabel);
      return {
        ok: true,
        order: updated || { ...order, status: nextStatus, status_updated_at: new Date().toISOString() },
        isLocalSimulation: true,
      };
    }
    return {
      ok: false,
      status: 0,
      message: "Tidak dapat terhubung ke server untuk memperbarui status order.",
    };
  }
}

export function completeSandboxInvoicePayment(
  invoiceId: string,
  paymentMethod: string
): InvoiceRecord | null {
  if (!isLocalDevFallbackEnabled()) return null;
  return markInvoicePaidInStore(invoiceId, paymentMethod);
}
