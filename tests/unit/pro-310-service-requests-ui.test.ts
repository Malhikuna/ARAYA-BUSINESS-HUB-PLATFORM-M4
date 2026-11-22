import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapDbServiceRequestToPermintaan,
  mergeServiceRequestsWithLocal,
  buildCreateQuotationHref,
  resolveLinkedQuotationLink,
  isUuid,
} from "@/lib/data/service-requests-api";
import { POST as createServiceRequestRoute } from "@/app/api/m4/v1/service-requests/route";
import { GET as getServiceRequestByIdRoute } from "@/app/api/m4/v1/service-requests/[id]/route";
import { prisma } from "@/lib/prisma";
import { SEEDED_PARTNER_JASA_ID } from "@/lib/services/service-request.service";

describe("PRO-310: Mapper & helper Permintaan Jasa (M4-US3-AC1 & AC2)", () => {
  it("memetakan baris API service_requests berstatus 'baru' dan 'sudah_ditawarkan' dengan akurat", () => {
    const rowBaru = mapDbServiceRequestToPermintaan({
      id: "11111111-2222-4333-8444-555555555555",
      partner_id: SEEDED_PARTNER_JASA_ID,
      customer_name: "PT Nusantara Jaya",
      customer_email: "info@nusantara.co.id",
      customer_phone: "081234567890",
      title: "Audit Pajak Tahunan",
      description: "Pendampingan SPT badan.",
      status: "baru",
      created_at: "2026-11-22T09:15:00.000Z",
    });

    assert.equal(isUuid(rowBaru.id), true);
    assert.equal(rowBaru.displayCode, "SR-11111111");
    assert.equal(rowBaru.status, "Baru");
    assert.equal(rowBaru.customerName, "PT Nusantara Jaya");
    assert.equal(rowBaru.whatsapp, "081234567890");
    assert.equal(
      buildCreateQuotationHref(rowBaru),
      "/penawaran/tambah?request_id=11111111-2222-4333-8444-555555555555"
    );

    const rowOffered = mapDbServiceRequestToPermintaan({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      partner_id: SEEDED_PARTNER_JASA_ID,
      customer_name: "CV Karya Mandiri",
      customer_email: "halo@karyamandiri.id",
      customer_phone: "081322110045",
      title: "Desain Identitas Brand",
      status: "sudah_ditawarkan",
      created_at: "2026-11-22T10:30:00.000Z",
      quotations: {
        id: "99999999-8888-4777-8666-555555555555",
        quotation_number: "PNW-202611-0009",
        status: "draf",
      },
    });

    assert.equal(rowOffered.status, "Sudah ditawarkan");
    assert.deepEqual(resolveLinkedQuotationLink(rowOffered), {
      href: "/penawaran/lihat/99999999-8888-4777-8666-555555555555",
      label: "PNW-202611-0009",
    });
  });

  it("tidak menghasilkan PNW-<uuid> mentah bila UUID belum memiliki relasi penawaran", () => {
    const link = resolveLinkedQuotationLink({
      id: "11111111-2222-4333-8444-555555555555",
    });
    assert.equal(link, null);

    const legacyLink = resolveLinkedQuotationLink({ id: "PMT-0005" });
    assert.deepEqual(legacyLink, {
      href: "/penawaran/lihat/PNW-0005",
      label: "PNW-0005",
    });
  });

  it("menggabungkan data DB dan lokal tanpa duplikasi ID", () => {
    const dbItem = mapDbServiceRequestToPermintaan({
      id: "11111111-2222-4333-8444-555555555555",
      partner_id: SEEDED_PARTNER_JASA_ID,
      customer_name: "PT Satu",
      customer_email: "satu@example.com",
      customer_phone: "081200001111",
      title: "Jasa A",
      status: "baru",
      created_at: "2026-11-22T08:00:00.000Z",
    });
    const merged = mergeServiceRequestsWithLocal([dbItem], [dbItem]);
    assert.equal(merged.length, 1);
  });
});

describe("PRO-310: Integrasi Simulator M5 -> POST & GET /api/m4/v1/service-requests (M4-US3-AC3)", () => {
  it("menyimpan permintaan dari payload M5 ke DB lokal lalu memetakannya ke UI detail", async () => {
    const uniqueEmail = `pro310.sim.${Date.now()}@example.com`;
    let createdId: string | null = null;
    let createdCustomerId: string | null = null;

    try {
      const postRes = await createServiceRequestRoute(
        new Request("http://localhost:3000/api/m4/v1/service-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-customer-token",
          },
          body: JSON.stringify({
            partner_id: SEEDED_PARTNER_JASA_ID,
            customer_name: "Simulasi M5 PRO-310",
            customer_email: uniqueEmail,
            customer_phone: "081799990001",
            title: "Uji Kirim Permintaan M5 ke M4",
            description: "Simulasi integrasi PRO-310.",
          }),
        })
      );

      assert.equal(postRes.status, 201);
      const postJson = await postRes.json();
      assert.equal(postJson.success, true);
      createdId = postJson.data.id;
      createdCustomerId = postJson.data.customer_id;

      const getRes = await getServiceRequestByIdRoute(
        new Request(`http://localhost:3000/api/m4/v1/service-requests/${createdId}`, {
          headers: { Authorization: "Bearer mock-partner-token" },
        }),
        { params: Promise.resolve({ id: createdId! }) }
      );
      assert.equal(getRes.status, 200);
      const getJson = await getRes.json();
      const mapped = mapDbServiceRequestToPermintaan(getJson.data);
      assert.equal(mapped.status, "Baru");
      assert.equal(mapped.title, "Uji Kirim Permintaan M5 ke M4");
      assert.equal(buildCreateQuotationHref(mapped), `/penawaran/tambah?request_id=${createdId}`);
    } finally {
      if (createdId) {
        await prisma.service_requests.deleteMany({ where: { id: createdId } });
      }
      if (createdCustomerId) {
        await prisma.customers.deleteMany({ where: { id: createdCustomerId, email: uniqueEmail } });
      }
    }
  });
});
