import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCustomerInput,
  CustomerValidationError,
} from '../src/lib/services/customer.service';
import { GET as getCustomersHandler, POST as createCustomerHandler } from '../src/app/api/m4/v1/customers/route';
import { GET as getCustomerByIdHandler } from '../src/app/api/m4/v1/customers/[id]/route';

describe('Customer API & Validation Test Suite (M4-US1 / PRO-13)', () => {
  describe('1. Validasi Field Wajib (CustomerInput)', () => {
    it('harus menolak jika nama kosong', () => {
      assert.throws(
        () => {
          validateCustomerInput({
            name: '',
            email: 'test@example.com',
            phone: '08123456789',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof CustomerValidationError);
          assert.equal(err.fields.name, 'Nama pelanggan wajib diisi.');
          return true;
        }
      );
    });

    it('harus menolak jika format email tidak valid', () => {
      assert.throws(
        () => {
          validateCustomerInput({
            name: 'PT Contoh',
            email: 'bukan-email-valid',
            phone: '08123456789',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof CustomerValidationError);
          assert.equal(err.fields.email, 'Format email pelanggan tidak valid.');
          return true;
        }
      );
    });

    it('harus menolak jika nomor telepon kurang dari 8 digit atau kosong', () => {
      assert.throws(
        () => {
          validateCustomerInput({
            name: 'PT Contoh',
            email: 'valid@example.com',
            phone: '123',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof CustomerValidationError);
          assert.ok(err.fields.phone.includes('minimal 8 digit'));
          return true;
        }
      );
    });

    it('harus meloloskan payload yang memenuhi seluruh kriteria wajib', () => {
      const valid = validateCustomerInput({
        name: '  CV Sukses Makmur  ',
        email: '  INFO@SUKSES.COM ',
        phone: '  +6281234567890 ',
        address: 'Jl. Riau No. 10',
      });

      assert.equal(valid.name, 'CV Sukses Makmur');
      assert.equal(valid.email, 'info@sukses.com');
      assert.equal(valid.phone, '+6281234567890');
      assert.equal(valid.address, 'Jl. Riau No. 10');
    });
  });

  describe('2. Endpoint HTTP Route Handlers', () => {
    it('POST /api/m4/v1/customers harus menolak payload kosong dengan 400', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await createCustomerHandler(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
      assert.ok(json.error.fields.name);
    });

    it('POST /api/m4/v1/customers harus menolak duplikat email pelanggan yang sudah ada (409)', async () => {
      // Kita gunakan email dari data seed yang sudah ada di Supabase
      const req = new Request('http://localhost:3000/api/m4/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'PT Kloning Baru',
          email: 'procurement@majubersama.co.id', // Sudah ada di seeder
          phone: '089999999999',
        }),
      });

      const res = await createCustomerHandler(req);
      assert.equal(res.status, 409);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'DUPLICATE_EMAIL');
      assert.ok(json.error.message.includes('sudah terdaftar'));
    });

    it('POST /api/m4/v1/customers harus menolak duplikat nomor telepon pelanggan yang sudah ada (409)', async () => {
      // Kita gunakan nomor telepon dari data seed yang sudah ada di Supabase
      const req = new Request('http://localhost:3000/api/m4/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CV Telepon Kembar',
          email: 'unik.email@perusahaan.id',
          phone: '081234567890', // Sudah ada di seeder
        }),
      });

      const res = await createCustomerHandler(req);
      assert.equal(res.status, 409);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'DUPLICATE_PHONE');
      assert.ok(json.error.message.includes('sudah terdaftar'));
    });

    it('GET /api/m4/v1/customers harus mengembalikan daftar pelanggan dengan amplop seragam (200)', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/customers?page=1&limit=5');
      const res = await getCustomersHandler(req);

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.meta);
      assert.ok(json.meta.total >= 3);
    });

    it('GET /api/m4/v1/customers/[id] harus mengembalikan 404 jika ID pelanggan tidak ditemukan', async () => {
      const req = new Request('http://localhost:3000/api/m4/v1/customers/00000000-0000-0000-0000-000000000999');
      const res = await getCustomerByIdHandler(req, {
        params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000999' }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'CUSTOMER_NOT_FOUND');
    });
  });
});
