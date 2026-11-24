import {
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceStatus,
  OrderRecord,
  OrderTimelineEntry,
} from "@/types/invoice-order";
import { normalizeOrderStatus } from "@/lib/invoice-order-helpers";

function toSafeNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : fallback;
  if (typeof val === "string") {
    const parsed = Number(val.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toSafeString(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" && Number.isFinite(val)) return String(val);
  return fallback;
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null;
}

function mapRawLineItems(rawItems: unknown): InvoiceLineItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((entry, idx) => {
    const row = asRecord(entry) || {};
    const product = asRecord(row.products_services);
    const qty = toSafeNumber(row.quantity, 1);
    const unitPrice = toSafeNumber(row.unit_price, 0);
    const subtotal = toSafeNumber(row.subtotal, qty * unitPrice);
    const rawDesc = toSafeString(row.description);
    const name =
      toSafeString(row.name) ||
      (rawDesc ? rawDesc.split(" — ")[0] : "") ||
      toSafeString(product?.name) ||
      `Item ${idx + 1}`;
    return {
      id: toSafeString(row.id, `LINE-${idx + 1}`),
      name,
      description: rawDesc.includes(" — ") ? rawDesc.split(" — ").slice(1).join(" — ") : rawDesc || undefined,
      quantity: qty,
      unit: toSafeString(row.unit) || toSafeString(product?.unit) || "Paket",
      unit_price: unitPrice,
      subtotal,
    };
  });
}

function normalizeRawInvoiceStatus(raw: unknown): InvoiceStatus {
  const lower = toSafeString(raw).trim().toLowerCase();
  if (lower === "paid" || lower === "lunas") return "lunas";
  return "belum_lunas";
}

/**
 * Mapper defensif respons API Invoice backend (Prisma Decimal string + relasi nested) ke `InvoiceRecord`.
 */
export function mapApiInvoiceRowToRecord(rawRow: unknown): InvoiceRecord {
  const row = asRecord(rawRow) || {};
  const customer = asRecord(row.customers) || asRecord(row.customer);
  const partner = asRecord(row.partners) || asRecord(row.partner);
  const order = asRecord(row.orders) || asRecord(row.order);
  const quotation = asRecord(row.quotations) || asRecord(row.quotation);

  const items = mapRawLineItems(row.items ?? row.invoice_items ?? row.quotation_items);
  const subtotal = toSafeNumber(
    row.subtotal,
    items.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const taxAmount = toSafeNumber(row.tax_amount, 0);
  const totalAmount = toSafeNumber(row.total_amount, subtotal + taxAmount);
  const taxRate = toSafeNumber(row.tax_rate, subtotal > 0 && taxAmount > 0 ? Math.round((taxAmount / subtotal) * 100) : 0);
  const nowIso = new Date().toISOString();
  const invoiceDate = toSafeString(row.invoice_date || row.created_at, nowIso).split("T")[0];
  const dueDate = toSafeString(row.due_date, invoiceDate).split("T")[0];
  const invNumber = toSafeString(row.invoice_number, toSafeString(row.id, "INV-UNKNOWN"));

  return {
    id: toSafeString(row.id, invNumber),
    invoice_number: invNumber,
    order_id: toSafeString(row.order_id || order?.id) || undefined,
    order_number: toSafeString(row.order_number || order?.order_number) || undefined,
    quotation_id: toSafeString(row.quotation_id || quotation?.id) || undefined,
    quotation_number: toSafeString(row.quotation_number || quotation?.quotation_number) || undefined,
    customer_id: toSafeString(row.customer_id || customer?.id),
    customer_user_id: toSafeString(row.customer_user_id || customer?.user_id),
    customer_name: toSafeString(row.customer_name || customer?.name, "Pelanggan"),
    customer_email: toSafeString(row.customer_email || customer?.email) || undefined,
    customer_phone: toSafeString(row.customer_phone || customer?.phone) || undefined,
    partner_id: toSafeString(row.partner_id || partner?.id),
    partner_name: toSafeString(row.partner_name || partner?.name, "Partner Araya"),
    partner_category: toSafeString(row.partner_category || partner?.category, "Layanan & Produk"),
    title:
      toSafeString(row.title) ||
      toSafeString(quotation?.notes) ||
      items[0]?.name ||
      `Tagihan ${invNumber}`,
    invoice_date: invoiceDate,
    due_date: dueDate,
    status: normalizeRawInvoiceStatus(row.status),
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    paid_at: toSafeString(row.paid_at) || undefined,
    payment_method: toSafeString(row.payment_method) || undefined,
    snap_token: toSafeString(row.snap_token) || undefined,
    items,
    created_at: toSafeString(row.created_at, nowIso),
    updated_at: toSafeString(row.updated_at || row.created_at, nowIso),
  };
}

/**
 * Mapper defensif respons API Order backend (Prisma Decimal string + relasi nested) ke `OrderRecord`.
 */
export function mapApiOrderRowToRecord(rawRow: unknown): OrderRecord {
  const row = asRecord(rawRow) || {};
  const customer = asRecord(row.customers) || asRecord(row.customer);
  const partner = asRecord(row.partners) || asRecord(row.partner);
  const invoice = asRecord(row.invoices) || asRecord(row.invoice);
  const quotation = asRecord(row.quotations) || asRecord(row.quotation);

  const items = mapRawLineItems(row.items ?? row.order_items ?? invoice?.invoice_items);
  const totalAmount = toSafeNumber(
    row.total_amount ?? invoice?.total_amount,
    items.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const status = normalizeOrderStatus(toSafeString(row.status, "baru"));
  const nowIso = new Date().toISOString();
  const createdAt = toSafeString(row.created_at, nowIso);
  const statusUpdatedAt = toSafeString(row.status_updated_at || row.updated_at || row.created_at, createdAt);
  const orderNumber = toSafeString(row.order_number, toSafeString(row.id, "ORD-UNKNOWN"));

  const rawTimeline = Array.isArray(row.timeline) ? row.timeline : [];
  const timeline: OrderTimelineEntry[] =
    rawTimeline.length > 0
      ? rawTimeline.map((entry, idx) => {
          const item = asRecord(entry) || {};
          return {
            id: toSafeString(item.id, `TL-${idx + 1}`),
            status: normalizeOrderStatus(toSafeString(item.status, status)),
            title: toSafeString(item.title, "Pembaruan status pesanan"),
            description: toSafeString(item.description),
            actor_label: toSafeString(item.actor_label, "Sistem M4"),
            timestamp: toSafeString(item.timestamp, statusUpdatedAt),
          };
        })
      : [
          {
            id: `TL-${orderNumber}`,
            status,
            title:
              status === "selesai"
                ? "Pesanan selesai"
                : status === "diproses"
                ? "Pesanan sedang diproses"
                : "Pesanan dibuat",
            description: `Status terkini pesanan ${orderNumber}.`,
            actor_label: toSafeString(row.partner_name || partner?.name, "Sistem M4"),
            timestamp: statusUpdatedAt,
          },
        ];

  return {
    id: toSafeString(row.id, orderNumber),
    order_number: orderNumber,
    invoice_id: toSafeString(row.invoice_id || invoice?.id),
    invoice_number: toSafeString(row.invoice_number || invoice?.invoice_number, "-"),
    invoice_status: normalizeRawInvoiceStatus(row.invoice_status ?? invoice?.status),
    quotation_number: toSafeString(row.quotation_number || quotation?.quotation_number) || undefined,
    customer_id: toSafeString(row.customer_id || customer?.id),
    customer_user_id: toSafeString(row.customer_user_id || customer?.user_id),
    customer_name: toSafeString(row.customer_name || customer?.name, "Pelanggan"),
    customer_phone: toSafeString(row.customer_phone || customer?.phone) || undefined,
    partner_id: toSafeString(row.partner_id || partner?.id),
    partner_name: toSafeString(row.partner_name || partner?.name, "Partner Araya"),
    partner_category: toSafeString(row.partner_category || partner?.category, "Layanan & Produk"),
    title: toSafeString(row.title) || items[0]?.name || `Pesanan ${orderNumber}`,
    notes: toSafeString(row.notes) || undefined,
    status,
    total_amount: totalAmount,
    items,
    created_at: createdAt,
    status_updated_at: statusUpdatedAt,
    timeline,
  };
}
