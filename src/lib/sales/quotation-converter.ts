import type { Quotation, Invoice } from './types';

export class QuotationNotFoundError extends Error {
  constructor(quotationId: string) {
    super(`Quotation dengan ID '${quotationId}' tidak ditemukan.`);
    this.name = 'QuotationNotFoundError';
  }
}

export class QuotationNotApprovedError extends Error {
  constructor(status: string) {
    super(`Quotation belum disetujui. Status saat ini: '${status}'. Hanya quotation 'ACCEPTED' (Disetujui) yang dapat dikonversi menjadi invoice.`);
    this.name = 'QuotationNotApprovedError';
  }
}

export class EmptyQuotationItemsError extends Error {
  constructor() {
    super('Daftar item penawaran kosong. Tambahkan item sebelum mengonversi ke invoice.');
    this.name = 'EmptyQuotationItemsError';
  }
}

export class QuotationAlreadyConvertedError extends Error {
  constructor(invoiceNumber: string) {
    super(`Quotation sudah pernah dikonversi menjadi invoice (${invoiceNumber}).`);
    this.name = 'QuotationAlreadyConvertedError';
  }
}

export interface ConvertQuotationOptions {
  dueDays?: number; // Default 2 hari (sesuai API contract v0.1)
  invoiceSequenceNumber?: number;
}

/**
 * Logika domain murni konversi Quotation ke Invoice
 * M4-US2-AC1: quotation disetujui -> dibuat invoice, invoice berstatus 'Belum lunas' (ISSUED)
 * M4-US2-AC2: quotation belum disetujui -> sistem tolak (QuotationNotApprovedError)
 * M4-US2-AC3: item kosong -> tolak
 */
export function convertQuotationToInvoiceDomain(
  quotation: Quotation,
  existingInvoiceForQuotation: Invoice | null = null,
  options: ConvertQuotationOptions = {}
): Invoice {
  // 1. Validasi keberadaan item
  if (!quotation.items || quotation.items.length === 0) {
    throw new EmptyQuotationItemsError();
  }

  // 2. M4-US2-AC2: Tolak jika quotation belum disetujui (ACCEPTED)
  if (quotation.status !== 'ACCEPTED') {
    throw new QuotationNotApprovedError(quotation.status);
  }

  // 3. Mencegah konversi berulang untuk quotation yang sama
  if (existingInvoiceForQuotation) {
    throw new QuotationAlreadyConvertedError(existingInvoiceForQuotation.number);
  }

  const now = new Date();
  const issueDate = now.toISOString().split('T')[0];
  
  const dueDays = options.dueDays ?? 2;
  const dueDateObj = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  const seq = options.invoiceSequenceNumber ?? 1;
  const padSeq = String(seq).padStart(4, '0');
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const invoiceNumber = `INV-${yearMonth}-${padSeq}`;
  const invoiceId = `inv_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

  // Snapshot item dan total harus identik
  const clonedItems = quotation.items.map((it) => ({ ...it }));

  // M4-US2-AC1: Status hasil konversi adalah 'ISSUED' (Belum lunas)
  const invoice: Invoice = {
    id: invoiceId,
    number: invoiceNumber,
    quotationId: quotation.id,
    orderId: null,
    partnerId: quotation.partnerId,
    customerId: quotation.customerId,
    status: 'ISSUED', // 'Belum lunas'
    issueDate,
    dueDate,
    subtotal: quotation.subtotal,
    discountTotal: quotation.discountTotal,
    taxTotal: quotation.taxTotal,
    grandTotal: quotation.grandTotal,
    items: clonedItems,
    payUrl: `/api/v1/invoices/${invoiceId}/payments`,
    paidAt: null,
    createdAt: now.toISOString(),
  };

  return invoice;
}
