import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyJwt } from '../../src/lib/auth/jwt';
import { fetchPartnerFromM3 } from '../../src/lib/integrations/m3-partner.client';
import {
  ensurePartnerProfile,
  PartnerForbiddenError,
  resolveAndVerifyPartnerProfile,
  resolveDbUuid,
  SEEDED_CUSTOMER_M1_USER_ID,
  SEEDED_PARTNER_JASA_ID,
  SEEDED_PARTNER_PRODUK_ID,
  SEEDED_PARTNER_UNVERIFIED_ID,
  SEEDED_USER_PARTNER_JASA_ID,
} from '../../src/lib/services/partner-profile.service';
import { createProduct, deleteProduct } from '../../src/lib/services/product.service';
import { prisma } from '../../src/lib/prisma';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('M3 Partner Adapter, UUID Mapper & Auto-Upsert Suite (PRO-306)', () => {
  describe('1. Deterministic Non-UUID -> UUID Mapper & JWT Compatibility', () => {
    it('harus mempertahankan payload partner_id mock-partner-token di verifyJwt', async () => {
      const res = await verifyJwt('mock-partner-token');
      assert.equal(res.valid, true);
      assert.equal(res.payload?.partner_id, 'ptr_01J9ZN5R1D');
    });

    it('harus memetakan alias mock/dev ke seeded UUID dan ID non-UUID acak secara deterministik', () => {
      assert.equal(resolveDbUuid('ptr_01J9ZN5R1D', 'partner'), SEEDED_PARTNER_JASA_ID);
      assert.equal(resolveDbUuid('usr_mock_partner_001', 'user'), SEEDED_USER_PARTNER_JASA_ID);
      assert.equal(resolveDbUuid(2, 'user'), SEEDED_USER_PARTNER_JASA_ID);
      assert.equal(resolveDbUuid('usr_01J9ZP2A8C', 'user'), SEEDED_CUSTOMER_M1_USER_ID);
      assert.equal(resolveDbUuid(17, 'user'), SEEDED_CUSTOMER_M1_USER_ID);

      const customA1 = resolveDbUuid('ptr_custom_99', 'partner');
      const customA2 = resolveDbUuid('ptr_custom_99', 'partner');
      const customB = resolveDbUuid(42, 'user');
      assert.equal(customA1, customA2);
      assert.match(customA1, UUID_PATTERN);
      assert.match(customB, UUID_PATTERN);
      assert.notEqual(customA1, customB);
    });
  });

  describe('2. M3 Partner HTTP Client & Defensive Parsing', () => {
    it('mengembalikan null tanpa melempar error jika M3_API_URL tidak dikonfigurasi', async () => {
      const prev = process.env.M3_API_URL;
      delete process.env.M3_API_URL;
      try {
        const res = await fetchPartnerFromM3({ partnerId: SEEDED_PARTNER_JASA_ID, m3ApiUrl: '' });
        assert.equal(res, null);
      } finally {
        if (prev !== undefined) process.env.M3_API_URL = prev;
      }
    });

    it('mendukung direct lookup GET /partners/{id}/ dengan schema OpenAPI M3 (kategori_usaha & dual ID)', async () => {
      const mockFetch: typeof fetch = async (input) => {
        assert.equal(String(input), 'https://m3.example.test/api/m3/v1/partners/PRT-20261108-A9F2/');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Detail partner ditemukan',
            data: {
              id: 7,
              partner_id: 'PRT-20261108-A9F2',
              user_id: 42,
              nama_usaha: 'Studio Desain Araya',
              kategori_usaha: 'Jasa',
              status: 'terverifikasi',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const record = await fetchPartnerFromM3({
        partnerId: 'PRT-20261108-A9F2',
        m3ApiUrl: 'https://m3.example.test/api/m3/v1',
        fetchImpl: mockFetch,
      });

      assert.ok(record);
      assert.equal(record.partner_id, 'PRT-20261108-A9F2');
      assert.equal(record.numeric_id, '7');
      assert.equal(record.user_id, '42');
      assert.equal(record.tipe_usaha, 'jasa');
      assert.equal(record.is_verified, true);
      assert.equal(record.status, 'terverifikasi');
    });

    it('fallback ke list GET /partners/?status=terverifikasi&per_page=100 saat hanya ada userId atau direct 404', async () => {
      const calls: string[] = [];
      const mockFetch: typeof fetch = async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith('/partners/9/')) {
          return new Response(JSON.stringify({ success: false }), { status: 404 });
        }
        assert.equal(url, 'https://m3.example.test/api/m3/v1/partners/?status=terverifikasi&per_page=100');
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                id: 9,
                partner_id: 'PRT-20261110-B1C2',
                user_id: 99,
                kategori_usaha: 'Produk',
                status: 'terverifikasi',
              },
            ],
            meta: { page: 1, per_page: 100, total: 1, total_pages: 1 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const byNumericFallback = await fetchPartnerFromM3({
        partnerId: '9',
        userId: '99',
        m3ApiUrl: 'https://m3.example.test',
        fetchImpl: mockFetch,
      });

      assert.ok(byNumericFallback);
      assert.equal(calls.length, 2);
      assert.equal(byNumericFallback.partner_id, 'PRT-20261110-B1C2');
      assert.equal(byNumericFallback.numeric_id, '9');
      assert.equal(byNumericFallback.tipe_usaha, 'produk');
      assert.equal(byNumericFallback.is_verified, true);
    });

    it('mengembalikan null pada network error atau HTTP 500 dari M3', async () => {
      const errorFetch: typeof fetch = async () => {
        throw new Error('ECONNREFUSED');
      };
      const serverErrFetch: typeof fetch = async () => new Response('error', { status: 503 });

      assert.equal(
        await fetchPartnerFromM3({
          partnerId: SEEDED_PARTNER_JASA_ID,
          m3ApiUrl: 'https://m3.example.test',
          fetchImpl: errorFetch,
        }),
        null
      );
      assert.equal(
        await fetchPartnerFromM3({
          partnerId: SEEDED_PARTNER_JASA_ID,
          m3ApiUrl: 'https://m3.example.test',
          fetchImpl: serverErrFetch,
        }),
        null
      );
    });
  });

  describe('3. Auto-Upsert partner_profiles (P2003 Prevention) & Local Fallback', () => {
    it('harus auto-upsert partner terverifikasi dari M3 dan mencegah P2003 saat membuat produk', async () => {
      const tempPartnerId = crypto.randomUUID();
      const tempUserId = crypto.randomUUID();
      const tempSku = `SRV-M3-${Date.now()}`;
      let createdProductId: string | undefined;

      const mockFetch: typeof fetch = async () =>
        new Response(
          JSON.stringify({
            data: {
              partners: [
                {
                  partner_id: tempPartnerId,
                  user_id: tempUserId,
                  tipe_usaha: 'jasa',
                  is_verified: true,
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

      try {
        const profile = await resolveAndVerifyPartnerProfile(
          { userId: tempUserId, role: 'Partner', partnerId: tempPartnerId },
          { m3ApiUrl: 'https://m3.example.test', fetchImpl: mockFetch }
        );

        assert.equal(profile.source, 'm3');
        assert.equal(profile.partner_id, tempPartnerId);
        assert.equal(profile.tipe_usaha, 'jasa');
        assert.equal(profile.is_verified, true);

        const created = await createProduct(
          {
            sku: tempSku,
            name: 'Jasa Sinkronisasi M3',
            type: 'SERVICE',
            price: 350000,
          },
          profile.partner_id
        );
        createdProductId = created.id;
        assert.equal(created.partner_id, tempPartnerId);
      } finally {
        if (createdProductId) {
          await deleteProduct(createdProductId).catch(() => undefined);
        }
        await prisma.partner_profiles.deleteMany({ where: { partner_id: tempPartnerId } });
      }
    });

    it('harus menolak partner unverified dari M3 dengan PartnerForbiddenError (403)', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                partner_id: 'ptr_unverified_m3',
                user_id: 'usr_unverified_m3',
                tipe_usaha: 'jasa',
                is_verified: false,
              },
            ],
          }),
          { status: 200 }
        );

      await assert.rejects(
        () =>
          resolveAndVerifyPartnerProfile(
            { userId: 'usr_unverified_m3', role: 'Partner', partnerId: 'ptr_unverified_m3' },
            { m3ApiUrl: 'https://m3.example.test', fetchImpl: mockFetch }
          ),
        (err: unknown) => err instanceof PartnerForbiddenError && err.status === 403
      );
    });

    it('harus fallback ke tabel lokal partner_profiles (T-39) saat M3 error/timeout', async () => {
      const failingFetch: typeof fetch = async () => {
        throw new Error('Timeout');
      };

      const jasa = await resolveAndVerifyPartnerProfile(
        { userId: 'usr_mock_partner_001', role: 'Partner', partnerId: 'ptr_01J9ZN5R1D' },
        { m3ApiUrl: 'https://m3.example.test', fetchImpl: failingFetch }
      );
      assert.equal(jasa.partner_id, SEEDED_PARTNER_JASA_ID);
      assert.equal(jasa.tipe_usaha, 'jasa');
      assert.equal(jasa.source, 'local_db');

      const produk = await resolveAndVerifyPartnerProfile(
        { userId: '10000000-0000-0000-0000-000000000002', role: 'Partner', partnerId: SEEDED_PARTNER_PRODUK_ID },
        { m3ApiUrl: 'https://m3.example.test', fetchImpl: failingFetch }
      );
      assert.equal(produk.partner_id, SEEDED_PARTNER_PRODUK_ID);
      assert.equal(produk.tipe_usaha, 'produk');

      await assert.rejects(
        () =>
          resolveAndVerifyPartnerProfile(
            { userId: '10000000-0000-0000-0000-000000000003', role: 'Partner', partnerId: SEEDED_PARTNER_UNVERIFIED_ID },
            { m3ApiUrl: 'https://m3.example.test', fetchImpl: failingFetch }
          ),
        (err: unknown) => err instanceof PartnerForbiddenError && err.status === 403
      );
    });

    it('harus menyinkronkan is_verified=false dan menolak 403 saat Partner di-suspend (ditangguhkan) di M3', async () => {
      const tempPartnerId = crypto.randomUUID();
      const tempUserId = crypto.randomUUID();

      try {
        await ensurePartnerProfile({
          partner_id: tempPartnerId,
          user_id: tempUserId,
          tipe_usaha: 'jasa',
          is_verified: true,
        });

        const suspendedFetch: typeof fetch = async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                id: 101,
                partner_id: tempPartnerId,
                user_id: tempUserId,
                kategori_usaha: 'Jasa',
                status: 'ditangguhkan',
                alasan_penangguhan: 'Pelanggaran ketentuan',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        await assert.rejects(
          () =>
            resolveAndVerifyPartnerProfile(
              { userId: tempUserId, role: 'Partner', partnerId: tempPartnerId },
              { m3ApiUrl: 'https://m3.example.test', fetchImpl: suspendedFetch }
            ),
          (err: unknown) =>
            err instanceof PartnerForbiddenError &&
            err.status === 403 &&
            err.message.includes('ditangguhkan')
        );

        const cached = await prisma.partner_profiles.findUnique({
          where: { partner_id: tempPartnerId },
        });
        assert.equal(cached?.is_verified, false);

        const offlineFetch: typeof fetch = async () => {
          throw new Error('Timeout');
        };
        await assert.rejects(
          () =>
            resolveAndVerifyPartnerProfile(
              { userId: tempUserId, role: 'Partner', partnerId: tempPartnerId },
              { m3ApiUrl: 'https://m3.example.test', fetchImpl: offlineFetch }
            ),
          (err: unknown) => err instanceof PartnerForbiddenError && err.status === 403
        );
      } finally {
        await prisma.partner_profiles.deleteMany({ where: { partner_id: tempPartnerId } });
      }
    });

    it('harus mencegah P2002 pada ensurePartnerProfile jika user_id sama namun partner_id berubah', async () => {
      const p1 = crypto.randomUUID();
      const p2 = crypto.randomUUID();
      const sharedUser = crypto.randomUUID();

      try {
        const first = await ensurePartnerProfile({
          partner_id: p1,
          user_id: sharedUser,
          tipe_usaha: 'produk',
          is_verified: true,
        });
        assert.equal(first.partner_id, p1);

        const second = await ensurePartnerProfile({
          partner_id: p2,
          user_id: sharedUser,
          tipe_usaha: 'jasa',
          is_verified: true,
        });
        assert.equal(second.partner_id, p2);
        assert.equal(second.tipe_usaha, 'jasa');
      } finally {
        await prisma.partner_profiles.deleteMany({
          where: { OR: [{ partner_id: p1 }, { partner_id: p2 }, { user_id: sharedUser }] },
        });
      }
    });
  });
});
