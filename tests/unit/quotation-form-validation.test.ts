import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateQuotationForm } from "@/lib/quotation-form-validation";
import { initialPermintaan } from "@/lib/data/mock-permintaan-data";
import { ProductItem } from "@/types/product";

const activePermintaan = initialPermintaan.find((p) => p.status === "Baru")!;
const offeredPermintaan = initialPermintaan.find((p) => p.status === "Sudah ditawarkan")!;

const sampleCatalog: ProductItem[] = [
  { id: "ITEM-002", sku: "SRV-WEB-002", name: "Jasa Pembuatan Website Korporat", category: "Jasa", unit: "Paket", price: "3200000", status: "Aktif", description: "Pembuatan website korporat" },
  { id: "ITEM-004", sku: "SRV-DSN-004", name: "Jasa Desain Logo", category: "Jasa", unit: "Paket", price: "750000", status: "Aktif", description: "Desain logo brand" },
  { id: "ITEM-005", sku: "SRV-BIZ-005", name: "Paket Konsultasi Bisnis", category: "Jasa", unit: "Sesi", price: "1500000", status: "Nonaktif", description: "Konsultasi bisnis nonaktif" },
  { id: "ITEM-010", sku: "PRD-LPT-010", name: "Laptop Kantor 14 Inci", category: "Produk", unit: "Unit", stock: 12, price: "8900000", status: "Aktif", description: "Laptop operasional kantor" },
];

describe("validateQuotationForm (PRD UC-04 & BR-13)", () => {
  it("mengizinkan Partner bebas mengatur jumlah (>= 1) dan menambah beberapa jasa aktif", () => {
    const res = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      catalogProducts: sampleCatalog,
      items: [
        { product_service_id: "ITEM-002", name: "Jasa Pembuatan Website Korporat", quantity: 3, unit_price: 3200000, subtotal: 9600000, category: "Jasa" },
        { product_service_id: "ITEM-004", name: "Jasa Desain Logo", quantity: 2, unit_price: 750000, subtotal: 1500000, category: "Jasa" },
      ],
    });
    assert.equal(res.isValid, true);
    assert.equal(res.errorMessage, null);
  });

  it("menolak dengan error merah jika daftar item kosong, jasa belum dipilih, atau jumlah <= 0", () => {
    const emptyRes = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      items: [],
    });
    assert.equal(emptyRes.isValid, false);
    assert.equal(emptyRes.bannerType, "error");

    const unselectedRes = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      items: [{ product_service_id: "", name: "", quantity: 1, unit_price: 0, subtotal: 0, category: "Jasa" }],
    });
    assert.equal(unselectedRes.isValid, false);
    assert.equal(unselectedRes.bannerType, "error");

    const zeroQtyRes = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      items: [{ product_service_id: "ITEM-002", name: "Jasa Pembuatan Website Korporat", quantity: 0, unit_price: 3200000, subtotal: 0, category: "Jasa" }],
    });
    assert.equal(zeroQtyRes.isValid, false);
    assert.equal(zeroQtyRes.bannerType, "error");
  });

  it("menolak item Produk fisik dan Jasa Nonaktif sesuai BR-13 & UC-04", () => {
    const productRes = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      catalogProducts: sampleCatalog,
      items: [{ product_service_id: "ITEM-010", name: "Laptop Kantor 14 Inci", quantity: 1, unit_price: 8900000, subtotal: 8900000, category: "Produk" }],
    });
    assert.equal(productRes.isValid, false);
    assert.equal(productRes.bannerType, "error");

    const inactiveServiceRes = validateQuotationForm({
      permintaanData: activePermintaan,
      selectedCustomerId: "CUST-001",
      catalogProducts: sampleCatalog,
      items: [{ product_service_id: "ITEM-005", name: "Paket Konsultasi Bisnis", quantity: 1, unit_price: 1500000, subtotal: 1500000, category: "Jasa" }],
    });
    assert.equal(inactiveServiceRes.isValid, false);
    assert.equal(inactiveServiceRes.bannerType, "error");
  });

  it("menolak pembuatan penawaran ganda untuk permintaan yang sudah ditawarkan (BR-13)", () => {
    const dupRes = validateQuotationForm({
      permintaanData: offeredPermintaan,
      selectedCustomerId: "CUST-001",
      items: [{ product_service_id: "ITEM-002", name: "Jasa Pembuatan Website Korporat", quantity: 1, unit_price: 3200000, subtotal: 3200000, category: "Jasa" }],
    });
    assert.equal(dupRes.isValid, false);
    assert.equal(dupRes.bannerType, "error");
    assert.ok(dupRes.actionHref?.startsWith("/penawaran/lihat/"));
  });
});
