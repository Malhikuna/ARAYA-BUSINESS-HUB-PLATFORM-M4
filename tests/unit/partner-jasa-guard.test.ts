import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createJwtToken } from '../../src/lib/auth/jwt';
import { requireServicePartner } from '../../src/lib/auth/partner-guard';
import {
  SEEDED_PARTNER_JASA_ID,
  SEEDED_PARTNER_PRODUK_ID,
  SEEDED_PARTNER_UNVERIFIED_ID,
} from '../../src/lib/services/partner-profile.service';
import { prisma } from '../../src/lib/prisma';
import { proxy } from '../../src/proxy';
import { GET as getProductsHandler, POST as createProductHandler } from '../../src/app/api/m4/v1/products/route';
import { DELETE as deleteProductHandler } from '../../src/app/api/m4/v1/products/[id]/route';
import { GET as getQuotationsHandler, POST as createQuotationHandler } from '../../src/app/api/m4/v1/quotations/route';
import { GET as getQuotationByIdHandler } from '../../src/app/api/m4/v1/quotations/[id]/route';
import { PATCH as updateQuotationStatusHandler } from '../../src/app/api/m4/v1/quotations/[id]/status/route';

describe('Partner Jasa Guard & Catalog Filter Test Suite (PRO-306)', () => {
  describe('1. Proxy & Reusable requireServicePartner Guard', () => {
    it('proxy() harus tetap meneruskan header user saat GET /api/m4/v1/products membawa Bearer token valid', async () => {
      const req = new NextRequest('http://localhost:3000/api/m4/v1/products', {
        method: 'GET',
        headers: { authorization: 'Bearer mock-partner-token' },
      });
      const res = await proxy(req);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-middleware-request-x-user-role'), 'Partner');
      assert.equal(res.headers.get('x-middleware-request-x-partner-id'), 'ptr_01J9ZN5R1D');
    });

    it('requireServicePartner harus menolak Partner Produk, Unverified Partner, dan Customer dengan 403', async () => {
      const produkToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000002',
        user_id: '10000000-0000-0000-0000-000000000002',
        role: 'Partner',
        partner_id: SEEDED_PARTNER_PRODUK_ID,
      });
      const unverifiedToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000003',
        user_id: '10000000-0000-0000-0000-000000000003',
        role: 'Partner',
        partner_id: SEEDED_PARTNER_UNVERIFIED_ID,
      });

      const produkRes = await requireServicePartner(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          headers: { authorization: `Bearer ${produkToken}` },
        }),
        { requireAuth: true }
      );
      assert.equal(produkRes.ok, false);
      if (!produkRes.ok) {
        assert.equal(produkRes.response.status, 403);
        const json = await produkRes.response.json();
        assert.equal(json.success, false);
        assert.equal(json.error.code, 'FORBIDDEN');
      }

      const unverifiedRes = await requireServicePartner(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          headers: { authorization: `Bearer ${unverifiedToken}` },
        }),
        { requireAuth: true }
      );
      assert.equal(unverifiedRes.ok, false);
      if (!unverifiedRes.ok) {
        assert.equal(unverifiedRes.response.status, 403);
      }

      const customerRes = await requireServicePartner(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          headers: { authorization: 'Bearer mock-customer-token' },
        }),
        { requireAuth: true }
      );
      assert.equal(customerRes.ok, false);
      if (!customerRes.ok) {
        assert.equal(customerRes.response.status, 403);
      }

      const jasaRes = await requireServicePartner(
        new Request('http://localhost:3000/api/m4/v1/service-requests', {
          headers: { authorization: 'Bearer mock-partner-token' },
        }),
        { requireAuth: true }
      );
      assert.equal(jasaRes.ok, true);
      if (jasaRes.ok) {
        assert.equal(jasaRes.partnerProfile?.partner_id, SEEDED_PARTNER_JASA_ID);
        assert.equal(jasaRes.partnerProfile?.tipe_usaha, 'jasa');
      }
    });
  });

  describe('2. Catalog Filter & Type Guard on /api/m4/v1/products', () => {
    it('GET /api/m4/v1/products memfilter katalog sesuai tipe_usaha Partner, sambil menjaga akses Admin & Publik', async () => {
      const publicRes = await getProductsHandler(
        new Request('http://localhost:3000/api/m4/v1/products?limit=50')
      );
      assert.equal(publicRes.status, 200);
      const publicJson = await publicRes.json();
      const publicTypes = new Set(publicJson.data.map((item: { type: string }) => item.type));
      assert.equal(publicTypes.has('PRODUCT'), true);
      assert.equal(publicTypes.has('SERVICE'), true);

      const adminRes = await getProductsHandler(
        new Request('http://localhost:3000/api/m4/v1/products?limit=50', {
          headers: { authorization: 'Bearer mock-admin-token' },
        })
      );
      assert.equal(adminRes.status, 200);
      const adminJson = await adminRes.json();
      const adminTypes = new Set(adminJson.data.map((item: { type: string }) => item.type));
      assert.equal(adminTypes.has('PRODUCT'), true);
      assert.equal(adminTypes.has('SERVICE'), true);

      const jasaRes = await getProductsHandler(
        new Request('http://localhost:3000/api/m4/v1/products?limit=50', {
          headers: { authorization: 'Bearer mock-partner-token' },
        })
      );
      assert.equal(jasaRes.status, 200);
      const jasaJson = await jasaRes.json();
      assert.ok(jasaJson.data.length > 0);
      assert.equal(jasaJson.data.every((item: { type: string }) => item.type === 'SERVICE'), true);

      const jasaQueryingProduk = await getProductsHandler(
        new Request('http://localhost:3000/api/m4/v1/products?type=PRODUCT', {
          headers: { authorization: 'Bearer mock-partner-token' },
        })
      );
      assert.equal(jasaQueryingProduk.status, 200);
      const mismatchJson = await jasaQueryingProduk.json();
      assert.equal(mismatchJson.data.length, 0);

      const produkToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000002',
        user_id: '10000000-0000-0000-0000-000000000002',
        role: 'Partner',
        partner_id: SEEDED_PARTNER_PRODUK_ID,
      });
      const produkRes = await getProductsHandler(
        new Request('http://localhost:3000/api/m4/v1/products?limit=50', {
          headers: { authorization: `Bearer ${produkToken}` },
        })
      );
      assert.equal(produkRes.status, 200);
      const produkJson = await produkRes.json();
      assert.ok(produkJson.data.length > 0);
      assert.equal(produkJson.data.every((item: { type: string }) => item.type === 'PRODUCT'), true);
    });

    it('POST /api/m4/v1/products menolak tipe tidak sesuai tipe_usaha (403) dan mengikat partner_id Partner', async () => {
      const produkToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000002',
        user_id: '10000000-0000-0000-0000-000000000002',
        role: 'Partner',
        partner_id: SEEDED_PARTNER_PRODUK_ID,
      });

      const forbiddenRes = await createProductHandler(
        new Request('http://localhost:3000/api/m4/v1/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${produkToken}`,
          },
          body: JSON.stringify({
            name: 'Jasa Ilegal Partner Produk',
            type: 'SERVICE',
            price: 100000,
          }),
        })
      );
      assert.equal(forbiddenRes.status, 403);
      const forbiddenJson = await forbiddenRes.json();
      assert.equal(forbiddenJson.success, false);
      assert.equal(forbiddenJson.error.code, 'FORBIDDEN');

      let createdId: string | undefined;
      try {
        const createRes = await createProductHandler(
          new Request('http://localhost:3000/api/m4/v1/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${produkToken}`,
            },
            body: JSON.stringify({
              sku: `PRD-GRD-${Date.now()}`,
              name: 'Produk Terikat Partner Produk',
              type: 'PRODUCT',
              price: 120000,
              partner_id: SEEDED_PARTNER_JASA_ID,
            }),
          })
        );
        assert.equal(createRes.status, 201);
        const createdJson = await createRes.json();
        createdId = createdJson.data.id;
        assert.equal(createdJson.data.partner_id, SEEDED_PARTNER_PRODUK_ID);
      } finally {
        if (createdId) {
          await deleteProductHandler(
            new Request(`http://localhost:3000/api/m4/v1/products/${createdId}`, {
              method: 'DELETE',
              headers: { authorization: `Bearer ${produkToken}` },
            }),
            { params: Promise.resolve({ id: createdId }) }
          );
        }
      }
    });
  });

  describe('3. Quotations Partner Jasa Guard (/api/m4/v1/quotations/**)', () => {
    it('harus menolak Partner Produk (403) pada GET, POST, [id], dan [id]/status', async () => {
      const produkToken = await createJwtToken({
        sub: '10000000-0000-0000-0000-000000000002',
        user_id: '10000000-0000-0000-0000-000000000002',
        role: 'Partner',
        partner_id: SEEDED_PARTNER_PRODUK_ID,
      });

      const getRes = await getQuotationsHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          headers: { authorization: `Bearer ${produkToken}` },
        })
      );
      assert.equal(getRes.status, 403);
      const getJson = await getRes.json();
      assert.equal(getJson.success, false);
      assert.equal(getJson.error.code, 'FORBIDDEN');

      const postRes = await createQuotationHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${produkToken}`,
          },
          body: JSON.stringify({
            customer_id: '00000000-0000-0000-0000-000000000001',
            items: [{ product_service_id: '00000000-0000-0000-0000-000000000001', quantity: 1, unit_price: 10000 }],
          }),
        })
      );
      assert.equal(postRes.status, 403);

      const existingQuotation = await prisma.quotations.findFirst();
      if (existingQuotation) {
        const detailRes = await getQuotationByIdHandler(
          new Request(`http://localhost:3000/api/m4/v1/quotations/${existingQuotation.id}`, {
            headers: { authorization: `Bearer ${produkToken}` },
          }),
          { params: Promise.resolve({ id: existingQuotation.id }) }
        );
        assert.equal(detailRes.status, 403);

        const patchRes = await updateQuotationStatusHandler(
          new Request(`http://localhost:3000/api/m4/v1/quotations/${existingQuotation.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${produkToken}`,
            },
            body: JSON.stringify({ status: 'disetujui' }),
          }),
          { params: Promise.resolve({ id: existingQuotation.id }) }
        );
        assert.equal(patchRes.status, 403);
      }
    });

    it('harus mengizinkan Partner Jasa (mock-partner-token) membuat quotation dan mengikat partner_id', async () => {
      const [customer, serviceItem] = await Promise.all([
        prisma.customers.findFirst(),
        prisma.products_services.findFirst({ where: { type: 'SERVICE' } }),
      ]);
      assert.ok(customer);
      assert.ok(serviceItem);

      let createdQuotationId: string | undefined;
      try {
        const res = await createQuotationHandler(
          new Request('http://localhost:3000/api/m4/v1/quotations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: 'Bearer mock-partner-token',
            },
            body: JSON.stringify({
              customer_id: customer.id,
              partner_id: SEEDED_PARTNER_PRODUK_ID,
              items: [
                {
                  product_service_id: serviceItem.id,
                  quantity: 1,
                  unit_price: Number(serviceItem.price),
                  tax_rate: 11,
                },
              ],
            }),
          })
        );
        assert.equal(res.status, 201);
        const json = await res.json();
        createdQuotationId = json.data.id;
        assert.equal(json.data.partner_id, SEEDED_PARTNER_JASA_ID);
      } finally {
        if (createdQuotationId) {
          await prisma.quotation_items.deleteMany({ where: { quotation_id: createdQuotationId } });
          await prisma.quotations.delete({ where: { id: createdQuotationId } }).catch(() => undefined);
        }
      }
    });
  });
});
