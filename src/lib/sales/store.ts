import type { Quotation, Invoice } from './types';

// In-memory data store untuk mock data sebelum DB/Prisma aktif
const quotationsDb = new Map<string, Quotation>();
const invoicesDb = new Map<string, Invoice>();

// Seed sample data untuk pengujian & development awal
const sampleApprovedQuotation: Quotation = {
  id: 'quo_01J9ZK8W2F',
  number: 'QUO-202610-0001',
  partnerId: 'ptr_01J9ZN5R1D',
  customerId: 'cus_01J9ZP2A8C',
  status: 'ACCEPTED', // 'Disetujui'
  validUntil: '2026-11-15',
  subtotal: '150000.00',
  discountTotal: '0.00',
  taxTotal: '16500.00',
  grandTotal: '166500.00',
  notes: 'Penawaran kaos seragam Unpas',
  items: [
    {
      productId: 'prd_01J9ZK8W2F',
      nameSnapshot: 'Kaos Unpas Size M',
      unitPriceSnapshot: '75000.00',
      quantity: 2,
      discount: '0.00',
      taxRateSnapshot: '0.1100',
      lineNet: '150000.00',
      lineTax: '16500.00',
      lineTotal: '166500.00',
    },
  ],
  createdAt: '2026-10-20T10:00:00Z',
  updatedAt: '2026-10-21T14:30:00Z',
};

const sampleDraftQuotation: Quotation = {
  id: 'quo_draft_001',
  number: 'QUO-202610-0002',
  partnerId: 'ptr_01J9ZN5R1D',
  customerId: 'cus_01J9ZP2A8C',
  status: 'DRAFT', // 'Belum disetujui'
  validUntil: '2026-11-20',
  subtotal: '25000.00',
  discountTotal: '0.00',
  taxTotal: '2750.00',
  grandTotal: '27750.00',
  notes: 'Draf penawaran',
  items: [
    {
      productId: 'prd_01J9ZK9X4G',
      nameSnapshot: 'Jasa Cetak A3',
      unitPriceSnapshot: '25000.00',
      quantity: 1,
      discount: '0.00',
      taxRateSnapshot: '0.1100',
      lineNet: '25000.00',
      lineTax: '2750.00',
      lineTotal: '27750.00',
    },
  ],
  createdAt: '2026-10-22T08:00:00Z',
  updatedAt: '2026-10-22T08:00:00Z',
};

quotationsDb.set(sampleApprovedQuotation.id, sampleApprovedQuotation);
quotationsDb.set(sampleDraftQuotation.id, sampleDraftQuotation);

export function findQuotationById(id: string): Quotation | null {
  return quotationsDb.get(id) ?? null;
}

export function saveQuotation(quotation: Quotation): void {
  quotationsDb.set(quotation.id, quotation);
}

export function findInvoiceByQuotationId(quotationId: string): Invoice | null {
  for (const inv of invoicesDb.values()) {
    if (inv.quotationId === quotationId) {
      return inv;
    }
  }
  return null;
}

export function saveInvoice(invoice: Invoice): void {
  invoicesDb.set(invoice.id, invoice);
}

export function getInvoiceCount(): number {
  return invoicesDb.size;
}
