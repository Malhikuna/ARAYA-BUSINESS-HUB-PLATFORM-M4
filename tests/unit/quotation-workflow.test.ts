import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createJwtToken } from '../../src/lib/auth/jwt';
import { prisma } from '../../src/lib/prisma';
import { SEEDED_PARTNER_JASA_ID } from '../../src/lib/services/partner-profile.service';
import { GET as getQuotationsHandler, POST as createQuotationHandler } from '../../src/app/api/m4/v1/quotations/route';
import { GET as getQuotationByIdHandler } from '../../src/app/api/m4/v1/quotations/[id]/route';
import { PATCH as updateQuotationStatusHandler } from '../../src/app/api/m4/v1/quotations/[id]/status/route';
import { POST as sendWhatsAppHandler } from '../../src/app/api/m4/v1/quotations/[id]/send-whatsapp/route';
import { POST as approveQuotationHandler } from '../../src/app/api/m4/v1/quotations/[id]/approve/route';
import { normalizeWhatsAppNumberTo62 } from '../../src/lib/services/quotation-workflow';

describe('Quotation SRS Lifecycle, Prefill, WhatsApp & Customer Approve Suite (PRO-307)', () => {
  it('harus menormalkan format nomor WhatsApp ke awalan 62 dan menolak status uppercase legacy', async () => {
    assert.equal(normalizeWhatsAppNumberTo62('0812-3456-7890'), '6281234567890');
    assert.equal(normalizeWhatsAppNumberTo62('+62 813-0000-1111'), '6281300001111');

    const serviceItem = await prisma.products_services.findFirst({
      where: { type: 'SERVICE', is_active: true, partner_id: SEEDED_PARTNER_JASA_ID },
    });
    const customer = await prisma.customers.findFirst();
    assert.ok(serviceItem && customer);

    const legacyRes = await createQuotationHandler(
      new Request('http://localhost:3000/api/m4/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer mock-partner-token' },
        body: JSON.stringify({
          customer_id: customer.id,
          status: 'PENDING_APPROVAL',
          items: [{ product_service_id: serviceItem.id, quantity: 1, unit_price: 50000 }],
        }),
      })
    );
    assert.equal(legacyRes.status, 400);

    const existingQuotation = await prisma.quotations.findFirst({
      where: { partner_id: SEEDED_PARTNER_JASA_ID },
    });
    if (existingQuotation) {
      const legacyPatch = await updateQuotationStatusHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${existingQuotation.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', authorization: 'Bearer mock-partner-token' },
          body: JSON.stringify({ status: 'APPROVED' }),
        }),
        { params: Promise.resolve({ id: existingQuotation.id }) }
      );
      assert.equal(legacyPatch.status, 400);
    }
  });

  it('harus menolak item bertipe PRODUCT atau milik partner lain pada POST /quotations', async () => {
    const customer = await prisma.customers.findFirst();
    assert.ok(customer);

    const tempProduct = await prisma.products_services.create({
      data: {
        sku: `PRD-TEST-${Date.now()}`,
        name: 'Produk Fisik Uji Tolak Quotation',
        type: 'PRODUCT',
        price: 50000,
        partner_id: SEEDED_PARTNER_JASA_ID,
      },
    });

    try {
      const res = await createQuotationHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: 'Bearer mock-partner-token' },
          body: JSON.stringify({
            customer_id: customer.id,
            items: [{ product_service_id: tempProduct.id, quantity: 1, unit_price: 50000 }],
          }),
        })
      );
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    } finally {
      await prisma.products_services.delete({ where: { id: tempProduct.id } }).catch(() => undefined);
    }
  });

  it('harus menjalankan alur penuh: service_request -> draf -> 409 duplikat -> send-whatsapp (terkirim) -> Customer approve (disetujui)', async () => {
    const serviceItem = await prisma.products_services.findFirst({
      where: { type: 'SERVICE', is_active: true, partner_id: SEEDED_PARTNER_JASA_ID },
    });
    assert.ok(serviceItem, 'Item Jasa aktif wajib ada');

    const custUserM1 = crypto.randomUUID();
    const otherCustUserM1 = crypto.randomUUID();
    const uniqSuffix = Date.now();

    const customer = await prisma.customers.create({
      data: {
        user_id: custUserM1,
        name: `Pelanggan Workflow ${uniqSuffix}`,
        email: `wf-${uniqSuffix}@example.com`,
        phone: `0812${String(uniqSuffix).slice(-8)}`,
      },
    });

    const serviceReq = await prisma.service_requests.create({
      data: {
        partner_id: SEEDED_PARTNER_JASA_ID,
        customer_id: customer.id,
        customer_user_id: custUserM1,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        title: 'Desain Landing Page Perusahaan',
        status: 'baru',
      },
    });

    let quotationId: string | undefined;
    try {
      // 1. POST /quotations dengan service_request_id -> draf + service_requests jadi sudah_ditawarkan
      const createRes = await createQuotationHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: 'Bearer mock-partner-token' },
          body: JSON.stringify({
            service_request_id: serviceReq.id,
            notes: 'Estimasi pengerjaan 7 hari kerja',
            items: [{ product_service_id: serviceItem.id, quantity: 2, unit_price: 250000, tax_rate: 11 }],
          }),
        })
      );
      assert.equal(createRes.status, 201);
      const createdJson = await createRes.json();
      quotationId = createdJson.data.id;
      assert.equal(createdJson.data.status, 'draf');
      assert.equal(createdJson.data.service_request_id, serviceReq.id);
      assert.equal(createdJson.data.subtotal, '500000.00');
      assert.equal(createdJson.data.tax_amount, '55000.00');
      assert.equal(createdJson.data.total_amount, '555000.00');

      const updatedReq = await prisma.service_requests.findUnique({ where: { id: serviceReq.id } });
      assert.equal(updatedReq?.status, 'sudah_ditawarkan');

      // 2. Duplikat quotation untuk service_request_id yang sama -> 409
      const dupRes = await createQuotationHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: 'Bearer mock-partner-token' },
          body: JSON.stringify({
            service_request_id: serviceReq.id,
            items: [{ product_service_id: serviceItem.id, quantity: 1, unit_price: 100000 }],
          }),
        })
      );
      assert.equal(dupRes.status, 409);

      // 3. Customer approve sebelum terkirim (masih draf) -> 422
      const custToken = await createJwtToken({ user_id: custUserM1, role: 'Customer' });
      const earlyApprove = await approveQuotationHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { authorization: `Bearer ${custToken}` },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(earlyApprove.status, 422);

      // 4. Kirim ke WhatsApp: draf -> terkirim + sent_at + https://wa.me/62...
      const waRes = await sendWhatsAppHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/send-whatsapp`, {
          method: 'POST',
          headers: { authorization: 'Bearer mock-partner-token' },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(waRes.status, 200);
      const waJson = await waRes.json();
      assert.equal(waJson.data.quotation.status, 'terkirim');
      assert.ok(waJson.data.quotation.sent_at);
      assert.match(waJson.data.whatsapp_url, /^https:\/\/wa\.me\/62\d+\?text=/);

      // Kirim WA ulang saat sudah terkirim -> 422
      const reWaRes = await sendWhatsAppHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/send-whatsapp`, {
          method: 'POST',
          headers: { authorization: 'Bearer mock-partner-token' },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(reWaRes.status, 422);

      // 5. Customer GET list & detail + isolasi lintas Customer (403)
      const listRes = await getQuotationsHandler(
        new Request('http://localhost:3000/api/m4/v1/quotations', {
          headers: { authorization: `Bearer ${custToken}` },
        })
      );
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.ok(listJson.data.some((q: { id: string }) => q.id === quotationId));

      const otherToken = await createJwtToken({ user_id: otherCustUserM1, role: 'Customer' });
      const crossDetail = await getQuotationByIdHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}`, {
          headers: { authorization: `Bearer ${otherToken}` },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(crossDetail.status, 403);

      const crossApprove = await approveQuotationHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { authorization: `Bearer ${otherToken}` },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(crossApprove.status, 403);

      // Partner tidak boleh memanggil endpoint approve Customer (403)
      const partnerApprove = await approveQuotationHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { authorization: 'Bearer mock-partner-token' },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(partnerApprove.status, 403);

      // 6. Customer pemilik klik Setujui -> disetujui + approved_at
      const approveRes = await approveQuotationHandler(
        new Request(`http://localhost:3000/api/m4/v1/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { authorization: `Bearer ${custToken}` },
        }),
        { params: Promise.resolve({ id: quotationId! }) }
      );
      assert.equal(approveRes.status, 200);
      const approveJson = await approveRes.json();
      assert.equal(approveJson.data.status, 'disetujui');
      assert.ok(approveJson.data.approved_at);
    } finally {
      if (quotationId) {
        await prisma.quotation_items.deleteMany({ where: { quotation_id: quotationId } });
        await prisma.quotations.delete({ where: { id: quotationId } }).catch(() => undefined);
      }
      await prisma.service_requests.delete({ where: { id: serviceReq.id } }).catch(() => undefined);
      await prisma.customers.delete({ where: { id: customer.id } }).catch(() => undefined);
    }
  });
});
