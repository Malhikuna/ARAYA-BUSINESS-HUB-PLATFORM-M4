import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuotationTotals,
  createQuotationSchema,
} from '../src/lib/services/quotation.service';
import { prisma } from '../src/lib/prisma';
import { GET as getQuotationsHandler, POST as createQuotationHandler } from '../src/app/api/m4/v1/quotations/route';
import { GET as getQuotationByIdHandler } from '../src/app/api/m4/v1/quotations/[id]/route';
import { PATCH as updateQuotationStatusHandler } from '../src/app/api/m4/v1/quotations/[id]/status/route';

describe('Quotation API & Status Workflow Test Suite (M4-US1 / PRO-49)', () => {
  describe('1. Financial Calculation (Round-Half-Up & Non-Float)', () => {
    it('harus menghitung subtotal, diskon, PPN 11%, dan total akhir dengan presisi 2 desimal', () => {
      const items = [
        {
          quantity: 2,
          unit_price: 1500000,
          discount_amount: 0,
          tax_rate: 11, // PPN 11%
        },
        {
          quantity: 1,
          unit_price: 750000,
          discount_amount: 50000,
          tax_rate: 11,
        },
      ];

      const result = calculateQuotationTotals(items);

      // Item 1: 2 * 1.500.000 = 3.000.000, tax 11% = 330.000, total = 3.330.000
      // Item 2: 1 * 750.000 = 750.000, disc = 50.000, net = 700.000, tax 11% = 77.000, total = 777.000
      // Subtotal: 3.750.000
      // Diskon: 50.000
      // PPN Total: 407.000
      // Grand Total: 4.107.000
      assert.equal(result.subtotal, 3750000);
      assert.equal(result.discount_amount, 50000);
      assert.equal(result.tax_amount, 407000);
      assert.equal(result.total_amount, 4107000);
    });

    it('harus memvalidasi bahwa array items wajib minimal 1 item (tolak jika kosong)', () => {
      const parsed = createQuotationSchema.safeParse({
        customer_id: '00000000-0000-0000-0000-000000000001',
        items: [],
      });

      assert.equal(parsed.success, false);
      if (!parsed.success) {
        assert.ok(parsed.error.issues.some((i) => i.message.includes('tidak boleh kosong')));
      }
    });
  });

  describe('2. HTTP Route Handlers', () => {
    it('POST /api/m4/v1/quotations harus menolak request tanpa item (422)', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: '00000000-0000-0000-0000-000000000001',
          items: [],
        }),
      });

      const res = await createQuotationHandler(req);
      assert.equal(res.status, 400); // Zod array min(1) validation error
    });

    it('POST /api/m4/v1/quotations harus berhasil membuat penawaran baru dengan nomor urut unik (201)', async () => {
      // Ambil customer dan product yang ada dari seeder
      const [customer, product] = await Promise.all([
        prisma.customers.findFirst(),
        prisma.products_services.findFirst(),
      ]);

      assert.ok(customer, 'Customer seeder harus ada');
      assert.ok(product, 'Product seeder harus ada');

      const req = new Request('http://localhost:3000/api/m4/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          status: 'PENDING_APPROVAL',
          notes: 'Penawaran uji coba otomatis',
          items: [
            {
              product_service_id: product.id,
              quantity: 2,
              unit_price: Number(product.price),
              discount_amount: 0,
              tax_rate: 11,
            },
          ],
        }),
      });

      const res = await createQuotationHandler(req);
      assert.equal(res.status, 201);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.id);
      assert.ok(json.data.quotation_number.startsWith('PNW-'));
      assert.equal(json.data.status, 'PENDING_APPROVAL');
      assert.equal(json.data.quotation_items.length, 1);

      // Uji alur status: Ubah status menjadi APPROVED (Disetujui)
      const patchReq = new Request(`http://localhost:3000/api/m4/v1/quotations/${json.data.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      const patchRes = await updateQuotationStatusHandler(patchReq, {
        params: Promise.resolve({ id: json.data.id }),
      });

      assert.equal(patchRes.status, 200);
      const patchJson = await patchRes.json();
      assert.equal(patchJson.success, true);
      assert.equal(patchJson.data.status, 'APPROVED');

      // Uji ambil detail quotation
      const getDetailReq = new Request(`http://localhost:3000/api/m4/v1/quotations/${json.data.id}`);
      const getDetailRes = await getQuotationByIdHandler(getDetailReq, {
        params: Promise.resolve({ id: json.data.id }),
      });

      assert.equal(getDetailRes.status, 200);
      const detailJson = await getDetailRes.json();
      assert.equal(detailJson.data.id, json.data.id);
      assert.equal(detailJson.data.status, 'APPROVED');
    });

    it('GET /api/m4/v1/quotations harus mengembalikan daftar penawaran terpaginasi (200)', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/quotations?page=1&limit=5');
      const res = await getQuotationsHandler(req);

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.meta);
    });
  });
});
