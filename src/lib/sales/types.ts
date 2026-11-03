export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

// Status invoice internal: ISSUED (Belum lunas), PAID (Lunas), OVERDUE, VOID
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';

export interface DocumentItem {
  id?: string;
  productId: string;
  nameSnapshot: string;
  unitPriceSnapshot: string; // NUMERIC(18,2) string
  quantity: number;
  discount: string; // NUMERIC(18,2) string
  taxRateSnapshot: string; // NUMERIC(5,4) string, misal "0.1100"
  lineNet: string; // quantity * unitPrice - discount
  lineTax: string; // ROUND_HALF_UP(lineNet * taxRate)
  lineTotal: string; // lineNet + lineTax
}

export interface Quotation {
  id: string;
  number: string;
  partnerId: string;
  customerId: string;
  status: QuotationStatus;
  validUntil: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  notes?: string;
  items: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  quotationId?: string | null;
  orderId?: string | null;
  partnerId: string;
  customerId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  items: DocumentItem[];
  payUrl?: string;
  paidAt?: string | null;
  createdAt: string;
}
