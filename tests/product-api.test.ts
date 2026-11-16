import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProductSchema,
} from '../src/lib/services/product.service';
import { GET as getProductsHandler, POST as createProductHandler } from '../src/app/api/m4/v1/products/route';
import { GET as getProductByIdHandler, DELETE as deleteProductByIdHandler } from '../src/app/api/m4/v1/products/[id]/route';

describe('Product & Service CRUD API Test Suite (M4-US1 / PRO-12)', () => {
  describe('1. Zod Schema Validation', () => {
    it('harus menolak jika field wajib SKU atau Nama tidak ada', () => {
      const parsed = createProductSchema.safeParse({
        type: 'SERVICE',
        price: 500000,
      });

      assert.equal(parsed.success, false);
      if (!parsed.success) {
        const errors = parsed.error.format();
        assert.ok(errors.sku);
        assert.ok(errors.name);
      }
    });

    it('harus menolak harga negatif (nonnegative constraint)', () => {
      const parsed = createProductSchema.safeParse({
        sku: 'TEST-SKU-001',
        name: 'Item Uji Coba',
        type: 'PRODUCT',
        price: -25000,
      });

      assert.equal(parsed.success, false);
      if (!parsed.success) {
        const errors = parsed.error.format();
        assert.ok(errors.price);
        assert.ok(errors.price._errors[0].includes('negatif'));
      }
    });

    it('harus otomatis menormalkan tipe "Jasa" / "Barang" ke standar sistem ("SERVICE" / "PRODUCT")', () => {
      const serviceParse = createProductSchema.safeParse({
        sku: 'SRV-TEST',
        name: 'Jasa Konsultasi',
        type: 'jasa',
        price: 100000,
      });
      assert.equal(serviceParse.success, true);
      if (serviceParse.success) {
        assert.equal(serviceParse.data.type, 'SERVICE');
      }

      const productParse = createProductSchema.safeParse({
        sku: 'PRD-TEST',
        name: 'Produk Fisik',
        type: 'barang',
        price: 250000,
      });
      assert.equal(productParse.success, true);
      if (productParse.success) {
        assert.equal(productParse.data.type, 'PRODUCT');
      }
    });

    it('harus menolak tipe yang di luar standar (bukan PRODUCT / SERVICE / ASSET)', () => {
      const parsed = createProductSchema.safeParse({
        sku: 'INV-TEST',
        name: 'Item Invalid',
        type: 'INVALID_TYPE',
        price: 100000,
      });

      assert.equal(parsed.success, false);
    });
  });

  describe('2. HTTP Route Handlers', () => {
    it('POST /api/m4/v1/products harus menolak payload kosong dengan 400', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await createProductHandler(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
      assert.ok(json.error.fields.sku);
      assert.ok(json.error.fields.name);
    });

    it('POST /api/m4/v1/products harus menolak duplikasi SKU (409 DUPLICATE_SKU)', async () => {
      // Menggunakan SKU yang sudah ada dari seed di Supabase
      const req = new Request('http://localhost:3000/api/m4/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'SRV-CONS-001', // Sudah ada di seeder
          name: 'Paket Kloning Konsultasi',
          type: 'SERVICE',
          price: 2000000,
        }),
      });

      const res = await createProductHandler(req);
      assert.equal(res.status, 409);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'DUPLICATE_SKU');
      assert.ok(json.error.message.includes('sudah terdaftar'));
    });

    it('GET /api/m4/v1/products harus mengembalikan daftar katalog produk/jasa terpaginasi (200)', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/products?page=1&limit=5');
      const res = await getProductsHandler(req);

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.meta);
      assert.ok(json.meta.total >= 3);
    });

    it('GET /api/m4/v1/products/[id] harus mengembalikan 404 jika ID tidak ditemukan', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/products/00000000-0000-0000-0000-000000000999');
      const res = await getProductByIdHandler(req, {
        params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000999' }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'PRODUCT_NOT_FOUND');
    });

    it('POST /api/m4/v1/products dengan type SERVICE tanpa SKU harus auto-generate SKU SRV- (TB-06)', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jasa Audit Infrastruktur Cloud',
          type: 'SERVICE',
          price: 4500000,
          unit: 'Sesi',
        }),
      });

      const res = await createProductHandler(req);
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.sku.startsWith('SRV-'));
      assert.equal(json.data.stock, 0);

      // Bersihkan item uji coba agar database tetap konsisten 4 item (2 Jasa, 2 Produk)
      if (json.data?.id) {
        await deleteProductByIdHandler(new Request(`http://localhost:3000/api/m4/v1/products/${json.data.id}`), {
          params: Promise.resolve({ id: json.data.id }),
        });
      }
    });
  });
});
