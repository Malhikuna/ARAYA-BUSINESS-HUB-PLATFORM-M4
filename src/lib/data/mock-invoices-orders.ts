import { InvoiceRecord, OrderRecord, OrderStatus } from "@/types/invoice-order";
import { initialInvoices, initialOrders } from "@/lib/data/mock-invoices-orders-data";

export { initialInvoices, initialOrders };

export const INVOICES_STORAGE_KEY = "araya_invoices_store_v1";
export const ORDERS_STORAGE_KEY = "araya_orders_store_v1";
export const INVOICE_ORDER_EVENT = "araya-invoice-order-update";

export function getStoredInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return initialInvoices;
  try {
    const raw = sessionStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as InvoiceRecord[];
    }
  } catch {
    /* ignore */
  }
  return initialInvoices;
}

export function getStoredOrders(): OrderRecord[] {
  if (typeof window === "undefined") return initialOrders;
  try {
    const raw = sessionStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as OrderRecord[];
    }
  } catch {
    /* ignore */
  }
  return initialOrders;
}

export function subscribeInvoiceOrderStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(INVOICE_ORDER_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(INVOICE_ORDER_EVENT, callback);
  };
}

export function updateOrderStatusInStore(
  orderId: string,
  nextStatus: OrderStatus,
  actorLabel: string
): OrderRecord | null {
  const now = new Date().toISOString();
  const orders = getStoredOrders();
  let updatedOrder: OrderRecord | null = null;
  const title = nextStatus === "diproses" ? "Sedang diproses partner" : "Pesanan selesai";
  const description =
    nextStatus === "diproses"
      ? "Partner telah memulai pengerjaan pesanan setelah pembayaran lunas."
      : "Pesanan telah diselesaikan sepenuhnya dan berstatus final (BR-09).";

  const nextOrders = orders.map((ord) => {
    if (ord.id === orderId || ord.order_number === orderId) {
      updatedOrder = {
        ...ord,
        status: nextStatus,
        status_updated_at: now,
        timeline: [
          ...ord.timeline,
          {
            id: `TL-${Date.now()}`,
            status: nextStatus,
            title,
            description,
            actor_label: actorLabel,
            timestamp: now,
          },
        ],
      };
      return updatedOrder;
    }
    return ord;
  });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
      window.dispatchEvent(new Event(INVOICE_ORDER_EVENT));
    } catch {
      /* ignore */
    }
  }
  return updatedOrder;
}
