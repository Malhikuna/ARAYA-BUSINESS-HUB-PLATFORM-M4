import { InvoiceRecord, OrderRecord, OrderStatus } from "@/types/invoice-order";
import { evaluateOrderProcessGuard } from "@/lib/invoice-order-helpers";
import {
  getStoredInvoices,
  getStoredOrders,
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

function resolvePartnerAuthHeader(allowDevFallback: boolean): string | undefined {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("araya_access_token");
      if (stored && stored.trim()) return `Bearer ${stored.trim()}`;
    } catch {
      /* ignore */
    }
  }
  return allowDevFallback ? "Bearer mock-partner-token" : undefined;
}

export async function fetchPartnerInvoicesApi(
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
): Promise<InvoiceRecord[]> {
  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const authHeader = resolvePartnerAuthHeader(allowDevFallback);
  try {
    const res = await fetchImpl("/api/m4/v1/invoices?limit=100", {
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

  return getStoredInvoices();
}

export async function fetchPartnerOrdersApi(
  fetchImpl: typeof fetch = fetch,
  options?: ApiFallbackOptions
): Promise<OrderRecord[]> {
  const allowDevFallback = options?.allowDevFallback ?? isLocalDevFallbackEnabled();
  const authHeader = resolvePartnerAuthHeader(allowDevFallback);
  try {
    const res = await fetchImpl("/api/m4/v1/orders?limit=100", {
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

  return getStoredOrders();
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
  const authHeader = resolvePartnerAuthHeader(allowDevFallback);
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
