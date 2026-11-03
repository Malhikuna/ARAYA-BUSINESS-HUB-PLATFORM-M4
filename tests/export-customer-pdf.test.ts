import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  wrapColumnText,
  buildCustomerReportPdfBytes,
} from "../src/lib/export-customer-pdf";
import { initialCustomers } from "../src/lib/data/mock-customers";

describe("Customer PDF Export Utility", () => {
  it("harus memecah teks kolom panjang sesuai batas karakter", () => {
    const lines = wrapColumnText(
      "Jl. Gatot Subroto Kav. 51, Jakarta Selatan",
      22
    );
    assert.ok(lines.length >= 2);
    for (const line of lines) {
      assert.ok(line.length <= 22);
    }
  });

  it("harus menghasilkan dokumen PDF 1.4 yang valid berisi data pelanggan dan filter", () => {
    const bytes = buildCustomerReportPdfBytes({
      customers: initialCustomers.slice(0, 5),
      totalRegistered: 18,
      activeCustomers: 15,
      selectedCity: "Jakarta",
      searchTerm: "",
      exportedAt: new Date("2026-11-01T06:00:00Z"),
    });

    const text = new TextDecoder().decode(bytes);
    assert.ok(text.startsWith("%PDF-1.4\n"));
    assert.ok(text.endsWith("%%EOF"));
    assert.ok(text.includes("ARAYA BUSINESS HUB"));
    assert.ok(text.includes("Filter Kota: Jakarta"));
    assert.ok(text.includes(initialCustomers[0].name));
    assert.ok(text.includes("Halaman 1 dari 1"));
  });

  it("harus otomatis membuat multi-halaman jika jumlah data melebihi kapasitas 1 halaman A4", () => {
    const manyCustomers = Array.from({ length: 35 }, (_, idx) => ({
      ...initialCustomers[0],
      id: `CUST-TEST-${idx + 1}`,
      name: `PT Pelanggan Korporasi ${idx + 1}`,
    }));

    const bytes = buildCustomerReportPdfBytes({
      customers: manyCustomers,
      totalRegistered: 35,
      activeCustomers: 15,
      selectedCity: "Semua kota",
      searchTerm: "",
    });

    const text = new TextDecoder().decode(bytes);
    assert.ok(text.includes("/Count 2"));
    assert.ok(text.includes("Halaman 1 dari 2"));
    assert.ok(text.includes("Halaman 2 dari 2"));
  });
});
