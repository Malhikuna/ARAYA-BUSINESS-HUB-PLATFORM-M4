export type QuotationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export type QuotationFilterStatus = 'ALL' | 'PENDING_APPROVAL' | 'APPROVED';

export interface QuotationLineItem {
  id: string;
  product_service_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit?: string;
  category?: 'Produk' | 'Jasa';
}

export interface QuotationActivity {
  id: string;
  title: string;
  time: string;
  description: string;
  status: 'completed' | 'pending';
}

export interface Quotation {
  id: string;
  quotation_number: string;
  doc_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  quotation_date: string;
  valid_until?: string;
  status: QuotationStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items: QuotationLineItem[];
  activities?: QuotationActivity[];
  updated_at?: string;
  created_at?: string;
  updated_at_label?: string;
  isNew?: boolean;
  createdAt?: string;
}

export interface QuotationFormItem {
  product_service_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit?: string;
  category?: 'Produk' | 'Jasa';
}

export interface QuotationFormValues {
  customer_id: string;
  quotation_date: string;
  notes: string;
  items: QuotationFormItem[];
}

export interface DbQuotationItemRow {
  id: string;
  product_service_id: string;
  description?: string | null;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  products_services?: { name?: string; type?: string; unit?: string } | null;
}

export interface DbQuotationRow {
  id: string;
  quotation_number: string;
  customer_id: string;
  quotation_date?: string | Date | null;
  valid_until?: string | Date | null;
  status: string;
  subtotal: number | string;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  total_amount: number | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  customers?: { name?: string; phone?: string; email?: string; address?: string } | null;
  quotation_items?: DbQuotationItemRow[] | null;
}
