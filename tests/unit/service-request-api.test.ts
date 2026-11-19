import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createJwtToken } from '../../src/lib/auth/jwt';
import { prisma } from '../../src/lib/prisma';
import {
  GET as getServiceRequestsHandler,
  POST as createServiceRequestHandler,
} from '../../src/app/api/m4/v1/service-requests/route';
import { GET as getServiceRequestByIdHandler } from '../../src/app/api/m4/v1/service-requests/[id]/route';
import { POST as simulateServiceRequestHandler } from '../../src/app/api/m4/v1/service-requests/simulate/route';
import {
  SEEDED_CUSTOMER_M1_USER_ID,
  SEEDED_PARTNER_JASA_ID,
} from '../../src/lib/services/service-request.service';

const PARTNER_PRODUK_ID = '00000000-0000-0000-0000-000000000002';
const SERVICE_KEY = process.env.SERVICE_KEY || 'araya-m4-service-key-2026';

describe('Service Requests API Test Suite (M4-US3 / PRO-304)', () => {
  it('POST /api/m4/v1/service-requests menolak payload tidak valid (400) dan partner bertipe produk (403)', async () => {
    const invalidRes = await createServiceRequestHandler(
      new Request('http://localhost:3000/api/m4/v1/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-service-key': SERVICE_KEY },
        body: JSON.stringify({ partner_id: SEEDED_PARTNER_JASA_ID, title: 'ab' }),
      })
    );
    assert.equal(invalidRes.status, 400);
    const invalidJson = await invalidRes.json();
    assert.equal(invalidJson.error.code, 'VALIDATION_ERROR');

    const produkTargetRes = await createServiceRequestHandler(
      new Request('http://localhost:3000/api/m4/v1/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-service-key': SERVICE_KEY },
        body: JSON.stringify({
          partner_id: PARTNER_PRODUK_ID,
          customer_name: 'Pelanggan Uji',
          customer_email: 'uji.produk@example.com',
          customer_phone: '081234567890',
          title: 'Permintaan ke Partner Produk',
        }),
      })
    );
    assert.equal(produkTargetRes.status, 403);
  });

  it('POST /api/m4/v1/service-requests (X-Service-Key & Customer M1) menyimpan status baru dan auto-upsert customers', async () => {
    const suffix = Date.now();
    const newEmail = `m5.req.${suffix}@example.com`;
    const newPhone = `0819${String(suffix).slice(-8)}`;
    const newCustomerUserId = crypto.randomUUID();
    let createdRequestId: string | undefined;
    let createdCustomerId: string | undefined;

    try {
      const res = await createServiceRequestHandler(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-service-key': SERVICE_KEY },
          body: JSON.stringify({
            partner_id: SEEDED_PARTNER_JASA_ID,
            customer_user_id: newCustomerUserId,
            customer_name: 'Customer M5 Baru',
            customer_email: newEmail,
            customer_phone: newPhone,
            title: 'Jasa Audit Keamanan Aplikasi',
            description: 'Butuh audit sebelum rilis.',
          }),
        })
      );

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.status, 'baru');
      assert.equal(json.data.partner_id, SEEDED_PARTNER_JASA_ID);
      assert.equal(json.data.customer_user_id, newCustomerUserId);
      assert.ok(json.data.customer_id);
      assert.equal(json.data.customers.email, newEmail);
      assert.equal(json.data.customers.user_id, newCustomerUserId);

      createdRequestId = json.data.id;
      createdCustomerId = json.data.customer_id;
    } finally {
      if (createdRequestId) {
        await prisma.service_requests.deleteMany({ where: { id: createdRequestId } });
      }
      if (createdCustomerId) {
        await prisma.customers.deleteMany({ where: { id: createdCustomerId } });
      }
    }
  });

  it('GET /api/m4/v1/service-requests & [id] menegakkan isolasi partner_id, menolak Partner Produk (403), dan menyertakan quotations', async () => {
    const otherPartnerId = crypto.randomUUID();
    const otherUserId = crypto.randomUUID();
    let otherRequestId: string | undefined;

    try {
      await prisma.partner_profiles.create({
        data: {
          partner_id: otherPartnerId,
          user_id: otherUserId,
          tipe_usaha: 'jasa',
          is_verified: true,
        },
      });

      const createdOther = await createServiceRequestHandler(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-service-key': SERVICE_KEY },
          body: JSON.stringify({
            partner_id: otherPartnerId,
            customer_user_id: SEEDED_CUSTOMER_M1_USER_ID,
            customer_name: 'Dudi Santoso',
            customer_email: 'dudi.santoso@gmail.com',
            customer_phone: '081711223344',
            title: 'Permintaan Khusus Partner Lain',
          }),
        })
      );
      assert.equal(createdOther.status, 201);
      otherRequestId = (await createdOther.json()).data.id;

      // Partner Jasa 1 tidak boleh melihat permintaan milik Partner Jasa 2
      const listRes = await getServiceRequestsHandler(
        new Request('http://localhost:3000/api/m4/v1/service-requests?limit=50', {
          headers: { authorization: 'Bearer mock-partner-token' },
        })
      );
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.equal(
        listJson.data.every((item: { partner_id: string }) => item.partner_id === SEEDED_PARTNER_JASA_ID),
        true
      );
      assert.equal(
        listJson.data.some((item: { id: string }) => item.id === otherRequestId),
        false
      );

      // Akses detail lintas Partner harus ditolak 403
      const crossDetailRes = await getServiceRequestByIdHandler(
        new Request(`http://localhost:3000/api/m4/v1/service-requests/${otherRequestId}`, {
          headers: { authorization: 'Bearer mock-partner-token' },
        }),
        { params: Promise.resolve({ id: otherRequestId! }) }
      );
      assert.equal(crossDetailRes.status, 403);

      // Partner Produk harus ditolak 403
      const produkToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000002',
        user_id: '10000000-0000-0000-0000-000000000002',
        role: 'Partner',
        partner_id: PARTNER_PRODUK_ID,
      });
      const produkRes = await getServiceRequestsHandler(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          headers: { authorization: `Bearer ${produkToken}` },
        })
      );
      assert.equal(produkRes.status, 403);
    } finally {
      if (otherRequestId) {
        await prisma.service_requests.deleteMany({ where: { id: otherRequestId } });
      }
      await prisma.partner_profiles.deleteMany({ where: { partner_id: otherPartnerId } });
    }
  });

  it('POST /api/m4/v1/service-requests/simulate membuat permintaan jasa simulasi M5 di dev-mode', async () => {
    let simId: string | undefined;
    try {
      const res = await simulateServiceRequestHandler(
        new Request('http://localhost:3000/api/m4/v1/service-requests/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer mock-partner-token',
          },
          body: JSON.stringify({ title: 'Simulasi Konsultasi Pajak UMKM' }),
        })
      );
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.data.status, 'baru');
      assert.equal(json.data.partner_id, SEEDED_PARTNER_JASA_ID);
      assert.equal(json.data.title, 'Simulasi Konsultasi Pajak UMKM');
      simId = json.data.id;
    } finally {
      if (simId) {
        await prisma.service_requests.deleteMany({ where: { id: simId } });
      }
    }
  });
});
