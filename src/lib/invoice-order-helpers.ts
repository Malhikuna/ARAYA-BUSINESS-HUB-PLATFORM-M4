import {
  CanonicalInvoiceStatus,
  InvoiceStatus,
  OrderProcessGuardResult,
  OrderRecord,
  OrderStatus,
} from "@/types/invoice-order";

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const CUSTOMER_PORTAL_MENUS = [
  { name: "Penawaran saya", href: "/penawaran", matchPrefix: "/penawaran" },
  { name: "Pesanan saya", href: "/order", matchPrefix: "/order" },
  { name: "Invoice saya", href: "/invoice", matchPrefix: "/invoice" },
] as const;

export function normalizeInvoiceStatus(status?: string | null): CanonicalInvoiceStatus {
  const lower = String(status || "").trim().toLowerCase();
  return lower === "paid" || lower === "lunas" ? "PAID" : "UNPAID";
}

export function getInvoiceStatusLabel(status?: string | null): "Lunas" | "Belum lunas" {
  return normalizeInvoiceStatus(status) === "PAID" ? "Lunas" : "Belum lunas";
}

export function normalizeOrderStatus(status?: string | null): OrderStatus {
  const lower = String(status || "").trim().toLowerCase();
  if (lower === "selesai" || lower === "completed" || lower === "done") return "selesai";
  if (lower === "diproses" || lower === "processing" || lower === "in_progress") return "diproses";
  return "baru";
}

export function getOrderStatusLabel(status?: string | null): "Baru" | "Diproses" | "Selesai" {
  const canonical = normalizeOrderStatus(status);
  if (canonical === "selesai") return "Selesai";
  if (canonical === "diproses") return "Diproses";
  return "Baru";
}

/**
 * Guard U-01 & BR-09 pada UI Order Partner (PRO-66 / PRO-312):
 * - Order berstatus Selesai bersifat final dan tidak boleh diubah lagi (BR-09).
 * - Order berstatus Baru HANYA boleh diproses ke Diproses jika Invoice terkait sudah Lunas (U-01).
 * - Order berstatus Diproses dapat dilanjutkan ke Selesai.
 */
export function evaluateOrderProcessGuard(
  order: Pick<OrderRecord, "status" | "invoice_status" | "invoice_number">
): OrderProcessGuardResult {
  const status = normalizeOrderStatus(order.status);
  const invoiceStatus = normalizeInvoiceStatus(order.invoice_status);

  if (status === "selesai") {
    return {
      canProcess: false,
      canComplete: false,
      isFinal: true,
      blockedByUnpaidInvoice: false,
      reason: "Order sudah selesai dan tidak dapat diubah lagi (BR-09).",
    };
  }

  if (status === "baru") {
    if (invoiceStatus !== "PAID") {
      return {
        canProcess: false,
        canComplete: false,
        isFinal: false,
        blockedByUnpaidInvoice: true,
        reason: `Invoice ${order.invoice_number} belum berstatus Lunas. Order baru dapat diproses setelah pembayaran lunas (Aturan U-01).`,
      };
    }
    return {
      canProcess: true,
      canComplete: false,
      isFinal: false,
      blockedByUnpaidInvoice: false,
      reason: null,
    };
  }

  return {
    canProcess: false,
    canComplete: true,
    isFinal: false,
    blockedByUnpaidInvoice: false,
    reason: null,
  };
}

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const normalized = normalizeOrderStatus(current);
  if (normalized === "baru") return "diproses";
  if (normalized === "diproses") return "selesai";
  return null;
}

/**
 * Isolasi kepemilikan data Customer M1 (BR-10 & UC-09):
 * Customer hanya boleh melihat Invoice dan Pesanan miliknya sendiri (tanpa Guest Tracking).
 */
export function canCustomerViewRecord(
  recordCustomerUserId?: string | null,
  activeCustomerUserId?: string | null
): boolean {
  if (!recordCustomerUserId || !activeCustomerUserId) return false;
  return recordCustomerUserId.trim().toLowerCase() === activeCustomerUserId.trim().toLowerCase();
}

export function formatDateId(dateInput?: string | null): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (!Number.isFinite(d.getTime())) return dateInput;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeWib(dateInput?: string | null): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (!Number.isFinite(d.getTime())) return dateInput;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} WIB`;
}

export function getInvoiceStatusForApi(status: InvoiceStatus): "lunas" | "belum_lunas" {
  return normalizeInvoiceStatus(status) === "PAID" ? "lunas" : "belum_lunas";
}
