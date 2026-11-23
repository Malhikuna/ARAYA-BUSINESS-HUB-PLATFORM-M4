import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  approveQuotationByCustomerApi,
  buildCustomerApprovalWhatsAppUrl,
  createQuotationViaApi,
  filterActivePartnerServices,
  formatRequestDisplayCode,
  mapServiceRequestRowToPrefill,
  normalizeWhatsAppTo62,
  sendQuotationViaWhatsAppApi,
} from "@/lib/data/quotation-workflow-api";
import { isCustomerViewerFromSnapshot } from "@/lib/auth/customer-session";
import { ProductItem } from "@/types/product";
import { Quotation } from "@/types/quotation";

const SAMPLE_REQUEST_UUID = "30000000-0000-0000-0000-000000000001";
const SAMPLE_CUSTOMER_UUID = "9008e27e-e6fb-406c-bacb-91f6a9176f02";
const SAMPLE_SERVICE_UUID = "40000000-0000-0000-0000-000000000001";
const SAMPLE_QUOTATION_UUID = "50000000-0000-0000-0000-000000000001";

describe("PRO-311: Prefill service_request, Jasa-only lock & WhatsApp helper (M4-US2-AC4 & AC5)", () => {
  it("mengunci pilihan item khusus kategori Jasa berstatus Aktif milik Partner", () => {
    const catalog: ProductItem[] = [
      { id: "1", sku: "SRV-1", name: "Jasa Audit", category: "Jasa", price: "1000000.00", description: "Audit sistem", status: "Aktif" },
      { id: "2", sku: "SRV-2", name: "Jasa Nonaktif", category: "Jasa", price: "500000.00", description: "Layanan lama", status: "Nonaktif" },
      { id: "3", sku: "PRD-1", name: "Laptop Kantor", category: "Produk", price: "9000000.00", description: "Perangkat kantor", status: "Aktif" },
    ];
    const filtered = filterActivePartnerServices(catalog);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "1");
    assert.equal(filtered[0].category, "Jasa");
    assert.equal(filtered[0].status, "Aktif");
  });

  it("memetakan respons API service_request menjadi prefill form penawaran", () => {
    const prefill = mapServiceRequestRowToPrefill({
      id: SAMPLE_REQUEST_UUID,
      customer_id: SAMPLE_CUSTOMER_UUID,
      customer_name: "Dudi Santoso",
      customer_email: "dudi@example.com",
      customer_phone: "081711223344",
      title: "Konsultasi Transformasi Digital",
      description: "Pendampingan sistem keuangan UMKM.",
      status: "baru",
      created_at: "2026-11-23T04:00:00.000Z",
    });

    assert.equal(prefill.id, SAMPLE_REQUEST_UUID);
    assert.equal(prefill.customerId, SAMPLE_CUSTOMER_UUID);
    assert.equal(prefill.customerName, "Dudi Santoso");
    assert.equal(prefill.whatsapp, "081711223344");
    assert.equal(prefill.status, "Baru");
    assert.equal(formatRequestDisplayCode(prefill.id), "SR-30000000");
  });

  it("menormalisasi nomor WA (08..., +62...) dan menyusun URL wa.me/62...", () => {
    assert.equal(normalizeWhatsAppTo62("0812-3456-7890"), "6281234567890");
    assert.equal(normalizeWhatsAppTo62("+62 817 1122 3344"), "6281711223344");

    const url = buildCustomerApprovalWhatsAppUrl({
      phone: "0812-3456-7890",
      customerName: "PT Maju Bersama",
      senderName: "Rani K.",
      quotationId: SAMPLE_QUOTATION_UUID,
      quotationNumber: "PNW-202611-0001",
      title: "Audit Pajak",
      totalAmount: 3500000,
      validUntil: "2026-12-07",
      origin: "https://araya.local",
    });
    assert.ok(url?.startsWith("https://wa.me/6281234567890?text="));
    assert.ok(url?.includes("PNW-202611-0001"));

    const invalid = buildCustomerApprovalWhatsAppUrl({
      phone: "123",
      customerName: "Invalid",
      senderName: "Rani K.",
      quotationId: SAMPLE_QUOTATION_UUID,
      quotationNumber: "PNW-0001",
      title: "Test",
      totalAmount: 100000,
    });
    assert.equal(invalid, null);
  });
});

describe("PRO-311: Deteksi peran Customer login M1 & alur API UC-04 / UC-05 (M4-US2-AC3, AC4, AC5)", () => {
  it("mendeteksi tampilan Customer M1 dari sesi auth maupun switcher dev lokal", () => {
    assert.equal(
      isCustomerViewerFromSnapshot({
        isDevSwitcherEnabled: false,
        devActiveRole: null,
        authSessionRole: "Customer",
        customerPreviewEnabled: false,
      }),
      true
    );
    assert.equal(
      isCustomerViewerFromSnapshot({
        isDevSwitcherEnabled: true,
        devActiveRole: "CUSTOMER",
        authSessionRole: null,
        customerPreviewEnabled: false,
      }),
      true
    );
    assert.equal(
      isCustomerViewerFromSnapshot({
        isDevSwitcherEnabled: true,
        devActiveRole: "PARTNER_SERVICE",
        authSessionRole: null,
        customerPreviewEnabled: false,
      }),
      false
    );
  });

  it("POST /api/m4/v1/quotations mengirim service_request_id + status draf dan fallback ke DRAFT bila backend belum merge PR #81", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      calls.push({ url, body });

      if (calls.length === 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Status tidak valid", fields: { status: "Invalid enum" } },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: SAMPLE_QUOTATION_UUID,
            quotation_number: "PNW-202611-0010",
            customer_id: SAMPLE_CUSTOMER_UUID,
            service_request_id: SAMPLE_REQUEST_UUID,
            quotation_date: "2026-11-23",
            valid_until: "2026-12-07",
            status: "DRAFT",
            subtotal: "1000000.00",
            discount_amount: "0.00",
            tax_amount: "0.00",
            total_amount: "1000000.00",
            customers: { name: "Dudi Santoso", phone: "081711223344", email: "dudi@example.com" },
            quotation_items: [],
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    };

    const prefill = mapServiceRequestRowToPrefill({
      id: SAMPLE_REQUEST_UUID,
      customer_id: SAMPLE_CUSTOMER_UUID,
      customer_name: "Dudi Santoso",
      customer_phone: "081711223344",
      title: "Konsultasi",
      status: "baru",
    });

    const result = await createQuotationViaApi(
      {
        permintaan: prefill,
        customerId: SAMPLE_CUSTOMER_UUID,
        customerName: "Dudi Santoso",
        customerPhone: "081711223344",
        quotationNumber: "PNW-0010",
        quotationDate: "2026-11-23",
        validUntil: "2026-12-07",
        notes: "Catatan",
        items: [
          {
            product_service_id: SAMPLE_SERVICE_UUID,
            name: "Jasa Audit",
            quantity: 1,
            unit_price: 1000000,
            subtotal: 1000000,
            category: "Jasa",
          },
        ],
        subtotal: 1000000,
        totalAmount: 1000000,
      },
      mockFetch
    );

    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.service_request_id, SAMPLE_REQUEST_UUID);
    assert.equal(calls[0].body.status, "draf");
    assert.equal(calls[1].body.status, "DRAFT");
    if (result.ok) {
      assert.equal(result.data.id, SAMPLE_QUOTATION_UUID);
      assert.equal(result.data.quotation_number, "PNW-202611-0010");
    }
  });

  it("POST /send-whatsapp & POST /approve memanggil endpoint resmi PR #81 dan mengembalikan status baru", async () => {
    const sampleQuo: Quotation = {
      id: SAMPLE_QUOTATION_UUID,
      quotation_number: "PNW-202611-0010",
      customer_id: SAMPLE_CUSTOMER_UUID,
      customer_name: "Dudi Santoso",
      customer_phone: "081711223344",
      quotation_date: "2026-11-23",
      valid_until: "2026-12-07",
      status: "draf",
      subtotal: 1000000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 1000000,
      items: [],
    };

    const mockWaFetch: typeof fetch = async (input) => {
      assert.ok(String(input).endsWith(`/api/m4/v1/quotations/${SAMPLE_QUOTATION_UUID}/send-whatsapp`));
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            whatsapp_url: "https://wa.me/6281711223344?text=Halo",
            quotation: {
              id: SAMPLE_QUOTATION_UUID,
              quotation_number: "PNW-202611-0010",
              customer_id: SAMPLE_CUSTOMER_UUID,
              status: "terkirim",
              subtotal: "1000000.00",
              total_amount: "1000000.00",
              sent_at: "2026-11-23T05:00:00.000Z",
              customers: { name: "Dudi Santoso", phone: "081711223344" },
              quotation_items: [],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const waResult = await sendQuotationViaWhatsAppApi(sampleQuo, "Rani K.", mockWaFetch);
    assert.equal(waResult.ok, true);
    if (waResult.ok) {
      assert.equal(waResult.data.status, "terkirim");
      assert.equal(waResult.whatsappUrl, "https://wa.me/6281711223344?text=Halo");
    }

    const mockApproveFetch: typeof fetch = async (input, init) => {
      assert.ok(String(input).endsWith(`/api/m4/v1/quotations/${SAMPLE_QUOTATION_UUID}/approve`));
      const headers = init?.headers as Record<string, string>;
      assert.ok(headers.Authorization.startsWith("Bearer "));
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: SAMPLE_QUOTATION_UUID,
            quotation_number: "PNW-202611-0010",
            customer_id: SAMPLE_CUSTOMER_UUID,
            status: "disetujui",
            subtotal: "1000000.00",
            total_amount: "1000000.00",
            approved_at: "2026-11-23T05:05:00.000Z",
            customers: { name: "Dudi Santoso", phone: "081711223344" },
            quotation_items: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const approveResult = await approveQuotationByCustomerApi(
      { ...sampleQuo, status: "terkirim" },
      mockApproveFetch
    );
    assert.equal(approveResult.ok, true);
    if (approveResult.ok) {
      assert.equal(approveResult.data.status, "disetujui");
      assert.equal(approveResult.data.approved_at, "2026-11-23T05:05:00.000Z");
    }
  });
});
