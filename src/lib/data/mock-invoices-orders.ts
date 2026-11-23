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

/**
 * Menandai invoice sebagai Lunas dan otomatis menyinkronkan invoice_status pada Order terkait
 * sehingga Guard U-01 di halaman Order Partner langsung terbuka.
 */
export function markInvoicePaidInStore(
  invoiceId: string,
  paymentMethod: string
): InvoiceRecord | null {
  const now = new Date().toISOString();
  const invoices = getStoredInvoices();
  let updatedInvoice: InvoiceRecord | null = null;
  const nextInvoices = invoices.map((inv) => {
    if (inv.id === invoiceId || inv.invoice_number === invoiceId) {
      updatedInvoice = {
        ...inv,
        status: "PAID",
        paid_at: now,
        payment_method: paymentMethod,
        updated_at: now,
      };
      return updatedInvoice;
    }
    return inv;
  });

  const orders = getStoredOrders();
  const nextOrders = orders.map((ord) => {
    if (
      ord.invoice_id === invoiceId ||
      ord.invoice_number === invoiceId ||
      (updatedInvoice && ord.id === updatedInvoice.order_id)
    ) {
      return {
        ...ord,
        invoice_status: "PAID" as const,
        status_updated_at: now,
        notes: "Invoice telah lunas via Midtrans. Order siap diproses oleh Partner.",
        timeline: [
          ...ord.timeline,
          {
            id: `TL-PAY-${Date.now()}`,
            status: ord.status,
            title: "Pembayaran invoice lunas",
            description: `Invoice ${ord.invoice_number} lunas via ${paymentMethod}.`,
            actor_label: "Midtrans Webhook",
            timestamp: now,
          },
        ],
      };
    }
    return ord;
  });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(nextInvoices));
      sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
      window.dispatchEvent(new Event(INVOICE_ORDER_EVENT));
    } catch {
      /* ignore */
    }
  }
  return updatedInvoice;
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
