import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesPermintaanQuery, matchesQuotationQuery } from "@/lib/search-matchers";
import { initialPermintaan } from "@/lib/data/mock-permintaan-data";
import { Quotation } from "@/types/quotation";

const sampleQuotations: Quotation[] = [
  {
    id: "q-test-005",
    quotation_number: "PNW-0005",
    permintaan_id: "PMT-0005",
    permintaan_title: "Konsultasi pajak & audit",
    customer_id: "CUST-001",
    customer_name: "PT Maju Bersama",
    customer_phone: "0812 3456 7890",
    quotation_date: "2026-11-16",
    valid_until: "2026-11-30",
    status: "PENDING_APPROVAL",
    subtotal: 2500000,
    discount_amount: 0,
    tax_amount: 275000,
    total_amount: 2775000,
    items: [{ id: "i-1", product_service_id: "SRV-1", name: "Konsultasi Pajak", quantity: 1, unit_price: 2500000, subtotal: 2500000 }],
  },
  {
    id: "q-test-004",
    quotation_number: "PNW-0004",
    permintaan_id: "PMT-0004",
    permintaan_title: "Redesain identitas brand",
    customer_id: "CUST-002",
    customer_name: "CV Karya Mandiri",
    customer_phone: "0813 2211 0045",
    quotation_date: "2026-11-15",
    valid_until: "2026-11-29",
    status: "APPROVED",
    subtotal: 3750000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 3750000,
    items: [{ id: "i-2", product_service_id: "SRV-2", name: "Desain Logo & Brand", quantity: 1, unit_price: 3750000, subtotal: 3750000 }],
  },
];

describe("matchesPermintaanQuery", () => {
  it("memfilter huruf tanpa bug whatsapp.includes('') pada semua baris", () => {
    const budiResults = initialPermintaan.filter((p) => matchesPermintaanQuery(p, "Budi Santoso"));
    assert.equal(budiResults.length, 1);
    assert.equal(budiResults[0].id, "PMT-0003");

    const noneResults = initialPermintaan.filter((p) => matchesPermintaanQuery(p, "kata-tidak-ada-xyz"));
    assert.equal(noneResults.length, 0);
  });

  it("mendukung pencarian nomor (dengan/tanpa strip), nama permintaan, jasa, WA, dan multi-kata", () => {
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "PMT-0007")).length, 1);
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "pmt0007")).length, 1);
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "laporan keuangan")).length, 1);
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "desain logo")).length, 1);
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "0817 1122")).length, 1);
    assert.equal(initialPermintaan.filter((p) => matchesPermintaanQuery(p, "Maju pajak")).length, 1);
    assert.equal(initialPermintaan.filter((p) => p.status === "Baru").length, 8);
    assert.equal(initialPermintaan.filter((p) => p.status === "Sudah ditawarkan").length, 2);
  });
});

describe("matchesQuotationQuery", () => {
  it("memfilter berdasarkan nomor penawaran, permintaan, customer, jasa, status, nominal, dan multi-kata", () => {
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "PNW-0005")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "pnw0004")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "PMT-0005")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "PMT-0004 | Redesain")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "CV Karya Mandiri")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "desain logo")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "Terkirim")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "Disetujui")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "3.750.000")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "Rp 3.750.000")).length, 1);
    assert.equal(sampleQuotations.filter((q) => matchesQuotationQuery(q, "tidak-ada-xyz")).length, 0);
  });
});
