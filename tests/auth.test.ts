import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { verifyJwt, createJwtToken } from '../src/lib/auth/jwt';
import { isPublicPath, getAllowedRolesForPath, isRoleAuthorized } from '../src/lib/auth/rbac';
import { proxy } from '../src/proxy';

describe('Auth & RBAC Test Suite (Task T-05 / PRO-44 - Panduan Integrasi v1.0)', () => {
  describe('1. JWT & Mock Token Verification', () => {
    it('harus menerima preset token mock-admin-token', async () => {
      const result = await verifyJwt('mock-admin-token');
      assert.equal(result.valid, true);
      assert.equal(result.payload?.role, 'Admin');
      assert.equal(result.payload?.sub, 'usr_mock_admin_001');
    });

    it('harus menerima preset token mock-partner-token beserta partner_id', async () => {
      const result = await verifyJwt('mock-partner-token');
      assert.equal(result.valid, true);
      assert.equal(result.payload?.role, 'Partner');
      assert.equal(result.payload?.partner_id, 'ptr_01J9ZN5R1D');
    });

    it('harus menerima preset token mock-customer-token', async () => {
      const result = await verifyJwt('mock-customer-token');
      assert.equal(result.valid, true);
      assert.equal(result.payload?.role, 'Customer');
    });

    it('harus berhasil memverifikasi token M1 dengan format user_id dan role kasir', async () => {
      const token = await createJwtToken({
        user_id: 42,
        role: 'kasir',
        name: 'Rani Kusumawati',
        unit_usaha_id: 3,
      });

      const result = await verifyJwt(token);
      assert.equal(result.valid, true);
      assert.equal(result.payload?.user_id, 42);
      assert.equal(result.payload?.sub, '42');
      assert.equal(result.payload?.role, 'kasir');
    });

    it('harus berhasil memverifikasi signed token baru HMAC-SHA256', async () => {
      const token = await createJwtToken({
        sub: 'usr_new_001',
        role: 'Admin',
        email: 'tester@unpas.ac.id',
      });

      const result = await verifyJwt(token);
      assert.equal(result.valid, true);
      assert.equal(result.payload?.sub, 'usr_new_001');
      assert.equal(result.payload?.role, 'Admin');
    });

    it('harus menolak token dengan signature yang diubah / dipalsukan', async () => {
      const validToken = await createJwtToken({ sub: 'usr_01', role: 'Customer' });
      const [h, p] = validToken.split('.');
      const tamperedToken = `${h}.${p}.invalidSignature123`;

      const result = await verifyJwt(tamperedToken);
      assert.equal(result.valid, false);
      assert.match(result.error ?? '', /tanda tangan/i);
    });

    it('harus menolak token yang telah kedaluwarsa (expired)', async () => {
      const expiredToken = await createJwtToken(
        { sub: 'usr_02', role: 'Partner' },
        undefined,
        -10
      );

      const result = await verifyJwt(expiredToken);
      assert.equal(result.valid, false);
      assert.match(result.error ?? '', /kedaluwarsa/i);
    });

    it('harus menolak string kosong atau token bukan JWT 3 bagian', async () => {
      const res1 = await verifyJwt('');
      assert.equal(res1.valid, false);

      const res2 = await verifyJwt('invalid.token');
      assert.equal(res2.valid, false);
    });
  });

  describe('2. RBAC Rules & Path Checker', () => {
    it('harus mengenali endpoint webhook payment dan dokumentasi sebagai rute publik', () => {
      assert.equal(isPublicPath('/api/m4/v1/webhooks/payments/midtrans'), true);
      assert.equal(isPublicPath('/api/m4/v1/health'), true);
      assert.equal(isPublicPath('/api/m4/v1/docs'), true);
      assert.equal(isPublicPath('/api/v1/webhooks/payments/midtrans'), true);
      assert.equal(isPublicPath('/api/m4/v1/orders'), false);
    });

    it('harus mengizinkan Customer untuk rute order keranjang K-04', () => {
      const allowed = getAllowedRolesForPath('/api/m4/v1/orders');
      assert.ok(allowed);
      assert.equal(isRoleAuthorized('Customer', allowed), true);
      assert.equal(isRoleAuthorized('customer', allowed), true);
    });

    it('harus mengizinkan Admin dan Partner untuk rute master produk & pelanggan', () => {
      const productRoles = getAllowedRolesForPath('/api/m4/v1/products');
      assert.ok(productRoles);
      assert.equal(isRoleAuthorized('Admin', productRoles), true);
      assert.equal(isRoleAuthorized('admin', productRoles), true);
      assert.equal(isRoleAuthorized('Partner', productRoles), true);
      assert.equal(isRoleAuthorized('partner', productRoles), true);
    });
  });

  describe('3. Proxy / Middleware Interception', () => {
    it('harus mengembalikan 401 UNAUTHENTICATED dengan amplop standar jika request tanpa token', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/products');
      const res = await proxy(req);

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'UNAUTHENTICATED');
      assert.ok(res.headers.get('x-request-id')?.startsWith('req_'));
    });

    it('harus mengembalikan 401 jika token invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/products', {
        headers: { authorization: 'Bearer token-ngawur-123' },
      });
      const res = await proxy(req);

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'UNAUTHENTICATED');
    });

    it('harus mengembalikan 403 FORBIDDEN jika Customer mengakses rute khusus Admin', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/admin/tax-settings', {
        headers: { authorization: 'Bearer mock-customer-token' },
      });
      const res = await proxy(req);

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'FORBIDDEN');
      assert.match(json.error.message, /tidak memiliki izin/i);
    });

    it('harus meloloskan rute publik tanpa token dan menyertakan x-request-id', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/webhooks/payments/midtrans');
      const res = await proxy(req);

      assert.equal(res.status, 200);
      assert.ok(res.headers.get('x-request-id'));
    });

    it('harus meloloskan Partner yang valid dan meneruskan header internal', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/products', {
        headers: { authorization: 'Bearer mock-partner-token' },
      });
      const res = await proxy(req);

      assert.equal(res.status, 200);
      assert.ok(res.headers.get('x-request-id'));
    });

    it('harus meloloskan panggilan antarmodul via X-Service-Key tanpa token pengguna', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/events', {
        headers: { 'x-service-key': 'araya-m4-service-key-2026' },
      });
      const res = await proxy(req);

      assert.equal(res.status, 200);
      assert.ok(res.headers.get('x-request-id'));
    });
  });
});
