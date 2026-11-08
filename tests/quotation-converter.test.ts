import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Quotation } from '../src/lib/sales/types';
import {
  convertQuotationToInvoiceDomain,
  QuotationNotApprovedError,
  EmptyQuotationItemsError,
  QuotationAlreadyConvertedError,
} from '../src/lib/sales/quotation-converter';
import { POST } from '../src/app/api/v1/quotations/[id]/convert/route';

describe('Quotation to Invoice Conversion Test Suite (M4-US2 / PRO-20)', () => {
  const validAcceptedQuotation: Quotation = {
    id: 'quo_test_01',
    number: 'QUO-202610-0001',
    partnerId: 'ptr_01J9ZN5R1D',
    customerId: 'cus_01J9ZP2A8C',
    status: 'ACCEPTED', // Disetujui
    validUntil: '2026-11-30',
    subtotal: '150000.00',
    discountTotal: '0.00',
    taxTotal: '16500.00',
    grandTotal: '166500.00',
    items: [
      {
        productId: 'prd_01',
        nameSnapshot: 'Kaos Polos Unpas',
        unitPriceSnapshot: '75000.00',
        quantity: 2,
        discount: '0.00',
        taxRateSnapshot: '0.1100',
        lineNet: '150000.00',
        lineTax: '16500.00',
        lineTotal: '166500.00',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('1. Domain Logic Unit Tests', () => {
    it('AC1: Berhasil mengonversi quotation ACCEPTED menjadi invoice berstatus ISSUED (Belum lunas)', () => {
      const invoice = convertQuotationToInvoiceDomain(validAcceptedQuotation, null, {
        invoiceSequenceNumber: 5,
      });

      assert.equal(invoice.status, 'ISSUED');
      assert.equal(invoice.quotationId, validAcceptedQuotation.id);
      assert.equal(invoice.grandTotal, validAcceptedQuotation.grandTotal);
      assert.equal(invoice.subtotal, validAcceptedQuotation.subtotal);
      assert.equal(invoice.taxTotal, validAcceptedQuotation.taxTotal);
      assert.equal(invoice.items.length, 1);
      assert.match(invoice.number, /^INV-\d{6}-0005$/);
      assert.ok(invoice.payUrl?.includes(invoice.id));
    });

    it('AC2: Menolak konversi jika quotation berstatus DRAFT', () => {
      const draftQuotation: Quotation = {
        ...validAcceptedQuotation,
        status: 'DRAFT',
      };

      assert.throws(
        () => convertQuotationToInvoiceDomain(draftQuotation),
        (err: Error) => {
          assert.ok(err instanceof QuotationNotApprovedError);
          assert.match(err.message, /belum disetujui/i);
          return true;
        }
      );
    });

    it('AC2: Menolak konversi jika quotation berstatus SENT, REJECTED, atau EXPIRED', () => {
      const statuses: Array<Quotation['status']> = ['SENT', 'REJECTED', 'EXPIRED'];
      for (const st of statuses) {
        const quo: Quotation = { ...validAcceptedQuotation, status: st };
        assert.throws(
          () => convertQuotationToInvoiceDomain(quo),
          QuotationNotApprovedError
        );
      }
    });

    it('AC3: Menolak konversi jika item quotation kosong', () => {
      const emptyItemsQuo: Quotation = {
        ...validAcceptedQuotation,
        items: [],
      };

      assert.throws(
        () => convertQuotationToInvoiceDomain(emptyItemsQuo),
        EmptyQuotationItemsError
      );
    });

    it('Menolak jika quotation sudah pernah dikonversi sebelumnya (Idempotensi/Duplicate check)', () => {
      const existingInvoice = convertQuotationToInvoiceDomain(validAcceptedQuotation);
      assert.throws(
        () => convertQuotationToInvoiceDomain(validAcceptedQuotation, existingInvoice),
        QuotationAlreadyConvertedError
      );
    });
  });

  describe('2. Endpoint HTTP Route Handler Tests', () => {
    it('Endpoint POST mengonversi quotation ACCEPTED dan mengembalikan HTTP 201 dengan status Belum lunas', async () => {
      const req = new Request('http://localhost:3000/api/v1/quotations/quo_01J9ZK8W2F/convert', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_admin',
          'x-user-role': 'Admin',
        },
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'quo_01J9ZK8W2F' }) });
      assert.equal(res.status, 201);

      const json = await res.json();
      assert.equal(json.data.invoice.status, 'ISSUED');
      assert.equal(json.data.invoice.status_label, 'Belum lunas');
      assert.equal(json.data.invoice.grand_total, '166500.00');
    });

    it('Endpoint POST menolak jika status quotation DRAFT dengan status 422 QUOTATION_NOT_APPROVED', async () => {
      const req = new Request('http://localhost:3000/api/v1/quotations/quo_draft_001/convert', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_admin',
          'x-user-role': 'Admin',
        },
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'quo_draft_001' }) });
      assert.equal(res.status, 422);

      const json = await res.json();
      assert.equal(json.error.code, 'QUOTATION_NOT_APPROVED');
      assert.match(json.error.message, /belum disetujui/i);
    });

    it('Endpoint POST menolak jika quotation tidak ditemukan dengan status 404', async () => {
      const req = new Request('http://localhost:3000/api/v1/quotations/quo_not_found/convert', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_admin',
          'x-user-role': 'Admin',
        },
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'quo_not_found' }) });
      assert.equal(res.status, 404);

      const json = await res.json();
      assert.equal(json.error.code, 'QUOTATION_NOT_FOUND');
    });

    it('Endpoint POST menolak jika request tidak terotentikasi dengan status 401', async () => {
      const req = new Request('http://localhost:3000/api/v1/quotations/quo_01J9ZK8W2F/convert', {
        method: 'POST',
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'quo_01J9ZK8W2F' }) });
      assert.equal(res.status, 401);

      const json = await res.json();
      assert.equal(json.error.code, 'UNAUTHORIZED');
    });
  });
});
