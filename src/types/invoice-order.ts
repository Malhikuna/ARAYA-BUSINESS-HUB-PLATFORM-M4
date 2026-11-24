export type InvoiceStatus = "UNPAID" | "PAID" | "belum_lunas" | "lunas";

export type CanonicalInvoiceStatus = "UNPAID" | "PAID";

export type OrderStatus = "baru" | "diproses" | "selesai";

export type OrderFilterStatus = "ALL" | OrderStatus;

export type InvoiceFilterStatus = "ALL" | CanonicalInvoiceStatus;

export interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  order_id?: string;
  order_number?: string;
  quotation_id?: string;
  quotation_number?: string;
  customer_id: string;
  customer_user_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  partner_id: string;
  partner_name: string;
  partner_category: string;
  title: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_at?: string;
  payment_method?: string;
  snap_token?: string;
  items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderTimelineEntry {
  id: string;
  status: OrderStatus;
  title: string;
  description: string;
  actor_label: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  invoice_id: string;
  invoice_number: string;
  invoice_status: InvoiceStatus;
  quotation_number?: string;
  customer_id: string;
  customer_user_id: string;
  customer_name: string;
  customer_phone?: string;
  partner_id: string;
  partner_name: string;
  partner_category: string;
  title: string;
  notes?: string;
  status: OrderStatus;
  total_amount: number;
  items: InvoiceLineItem[];
  created_at: string;
  status_updated_at: string;
  timeline: OrderTimelineEntry[];
}

export interface OrderProcessGuardResult {
  canProcess: boolean;
  canComplete: boolean;
  isFinal: boolean;
  blockedByUnpaidInvoice: boolean;
  reason: string | null;
}
