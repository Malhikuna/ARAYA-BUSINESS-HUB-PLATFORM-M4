import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../../src/proxy';
import { createJwtToken } from '../../src/lib/auth/jwt';
import { isPublicPath } from '../../src/lib/auth/rbac';
import { fetchMeFromM1, loginWithM1, logoutWithM1 } from '../../src/lib/auth/m1-client';
import { POST as loginPost } from '../../src/app/api/m4/v1/auth/login/route';
import { POST as logoutPost } from '../../src/app/api/m4/v1/auth/logout/route';
import { GET as meGet } from '../../src/app/api/m4/v1/auth/me/route';

describe('M1 Auth Integration, Permissions m4.* & Proxy Endpoints Suite', () => {
  describe('1. Public vs Protected Auth Routes', () => {
    it('mengizinkan POST /api/m4/v1/auth/login publik namun memproteksi /auth/logout dan /auth/me', () => {
      assert.equal(isPublicPath('/api/m4/v1/auth/login', 'POST'), true);
      assert.equal(isPublicPath('/api/m4/v1/auth/logout', 'POST'), false);
      assert.equal(isPublicPath('/api/m4/v1/auth/me', 'GET'), false);
    });
  });

  describe('2. Penegakan Klaim Permissions m4.* di proxy()', () => {
    it('menolak POST /products (403) jika JWT hanya membawa m4.products.read', async () => {
      const token = await createJwtToken({
        user_id: 21,
        role: 'partner',
        partner_id: 5,
        permissions: ['m4.products.read'],
      });

      const req = new NextRequest('http://localhost:3000/api/m4/v1/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await proxy(req);
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'FORBIDDEN');
    });

    it('meloloskan PATCH /quotations/[id]/status jika JWT membawa m4.quotations.approve dan menolak POST /quotations', async () => {
      const token = await createJwtToken({
        user_id: 22,
        role: 'partner',
        partner_id: 5,
        permissions: ['m4.quotations.approve'],
      });

      const approveReq = new NextRequest('http://localhost:3000/api/m4/v1/quotations/q-1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const approveRes = await proxy(approveReq);
      assert.equal(approveRes.status, 200);

      const createReq = new NextRequest('http://localhost:3000/api/m4/v1/quotations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const createRes = await proxy(createReq);
      assert.equal(createRes.status, 403);
    });

    it('meloloskan is_super_admin meskipun array permissions kosong dan tetap kompatibel dengan mock-partner-token', async () => {
      const superToken = await createJwtToken({
        user_id: 1,
        role: 'administrator',
        is_super_admin: true,
        permissions: [],
      });

      const superRes = await proxy(
        new NextRequest('http://localhost:3000/api/m4/v1/products', {
          method: 'POST',
          headers: { Authorization: `Bearer ${superToken}` },
        })
      );
      assert.equal(superRes.status, 200);

      const mockRes = await proxy(
        new NextRequest('http://localhost:3000/api/m4/v1/products', {
          method: 'POST',
          headers: { Authorization: 'Bearer mock-partner-token' },
        })
      );
      assert.equal(mockRes.status, 200);
    });
  });

  describe('3. M1 HTTP Client (loginWithM1, logoutWithM1, fetchMeFromM1)', () => {
    it('loginWithM1 meneruskan 200, 401 INVALID_CREDENTIALS, dan 502 saat jaringan gagal', async () => {
      const okRes = await loginWithM1('adminaraya@mail.com', 'arayaunpas123', {
        m1ApiUrl: 'https://m1.example.test/api/m1/v1',
        fetchImpl: async (url) => {
          assert.equal(String(url), 'https://m1.example.test/api/m1/v1/auth/login');
          return new Response(
            JSON.stringify({
              success: true,
              data: { access_token: 'jwt.mock.token', token_type: 'Bearer', expires_in: 28800 },
            }),
            { status: 200 }
          );
        },
      });
      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.success, true);

      const unauthRes = await loginWithM1('adminaraya@mail.com', 'wrong', {
        m1ApiUrl: 'https://m1.example.test/api/m1/v1',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'INVALID_CREDENTIALS', message: 'Kredensial tidak valid', fields: null },
            }),
            { status: 401 }
          ),
      });
      assert.equal(unauthRes.status, 401);
      assert.equal(unauthRes.body.success, false);

      const errRes = await loginWithM1('adminaraya@mail.com', 'arayaunpas123', {
        m1ApiUrl: 'https://m1.example.test/api/m1/v1',
        fetchImpl: async () => {
          throw new Error('ECONNREFUSED');
        },
      });
      assert.equal(errRes.status, 502);
      assert.equal(errRes.body.success, false);
    });

    it('logoutWithM1 dan fetchMeFromM1 memproses respons OpenAPI M1 v1.1.0 dengan benar', async () => {
      const logoutRes = await logoutWithM1('jwt.mock.token', {
        m1ApiUrl: 'https://m1.example.test/api/m1/v1',
        fetchImpl: async (url) => {
          assert.equal(String(url), 'https://m1.example.test/api/m1/v1/auth/sessions/logout');
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        },
      });
      assert.equal(logoutRes.status, 200);
      assert.equal(logoutRes.body.success, true);

      const profile = await fetchMeFromM1('jwt.mock.token', {
        m1ApiUrl: 'https://m1.example.test/api/m1/v1',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                user_id: 1,
                name: 'Administrator',
                role: 'administrator',
                division: null,
                partner_id: null,
                unit_usaha_id: null,
                is_super_admin: true,
              },
            }),
            { status: 200 }
          ),
      });
      assert.ok(profile);
      assert.equal(profile.user_id, 1);
      assert.equal(profile.is_super_admin, true);
    });
  });

  describe('4. Route Handlers (/api/m4/v1/auth/login, logout, me)', () => {
    it('POST /auth/login menolak JSON rusak (400) dan payload invalid (422)', async () => {
      const badJsonRes = await loginPost(
        new Request('http://localhost:3000/api/m4/v1/auth/login', {
          method: 'POST',
          body: '{broken',
        })
      );
      assert.equal(badJsonRes.status, 400);

      const invalidRes = await loginPost(
        new Request('http://localhost:3000/api/m4/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'bukan-email', password: '' }),
        })
      );
      assert.equal(invalidRes.status, 422);
      const invalidBody = await invalidRes.json();
      assert.equal(invalidBody.error.code, 'VALIDATION_ERROR');
    });

    it('POST /auth/logout menolak tanpa Bearer token (401) dan GET /auth/me mengembalikan amplop seragam', async () => {
      const logoutRes = await logoutPost(
        new Request('http://localhost:3000/api/m4/v1/auth/logout', { method: 'POST' })
      );
      assert.equal(logoutRes.status, 401);

      const unauthMe = await meGet(new Request('http://localhost:3000/api/m4/v1/auth/me'));
      assert.equal(unauthMe.status, 401);
      const unauthBody = await unauthMe.json();
      assert.equal(unauthBody.success, false);
      assert.equal(unauthBody.error.code, 'UNAUTHENTICATED');

      const okMe = await meGet(
        new Request('http://localhost:3000/api/m4/v1/auth/me', {
          headers: {
            'x-user-id': '1',
            'x-user-role': 'administrator',
            'x-user-name': 'Administrator',
            'x-user-super-admin': 'true',
            'x-user-permissions': 'm4.products.read,m4.products.manage',
          },
        })
      );
      assert.equal(okMe.status, 200);
      const okBody = await okMe.json();
      assert.equal(okBody.success, true);
      assert.equal(okBody.data.user_id, '1');
      assert.equal(okBody.data.is_super_admin, true);
      assert.deepEqual(okBody.data.permissions, ['m4.products.read', 'm4.products.manage']);
    });
  });
});
