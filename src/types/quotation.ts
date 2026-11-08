export type QuotationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export type QuotationFilterStatus = 'ALL' | 'PENDING_APPROVAL' | 'APPROVED';

export interface QuotationLineItem {
  id: string;
  product_service_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit?: string;
  category?: 'Produk' | 'Jasa';
}

export interface Quotation {
  id: string;
  quotation_number: string;
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
