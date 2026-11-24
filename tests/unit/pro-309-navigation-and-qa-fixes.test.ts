import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getVisibleSidebarMenus,
  canAccessRoute,
  resolveRoleFromAuthSession,
  resolveEffectiveRole,
  normalizeTipeUsaha,
} from "@/lib/auth/navigation-access";
import { parseCustomerApiError } from "@/lib/customer-api-error";
import {
  DEFAULT_PPN_RATE,
  calculateLineTaxRupiah,
  calculateQuotationTaxSummary,
} from "@/lib/quotation-helpers";

describe("PRO-309: Navigasi adaptif M3/M1 & route guard (M4-US1-AC3)", () => {
  it("menyembunyikan Permintaan & Penawaran dan memblokir akses langsung URL untuk Partner Produk", () => {
    const menus = getVisibleSidebarMenus("PARTNER_PRODUCT", "produk");
    const hrefs = menus.map((m) => m.href);
    assert.deepEqual(hrefs, ["/produk", "/pelanggan", "/invoice", "/order"]);
    assert.equal(hrefs.includes("/permintaan"), false);
    assert.equal(hrefs.includes("/penawaran"), false);

    // Override tipe_usaha = "produk" dari M3 harus memaksa akses Partner Produk meski role awal PARTNER_SERVICE
    assert.equal(resolveEffectiveRole("PARTNER_SERVICE", "produk"), "PARTNER_PRODUCT");
    assert.equal(canAccessRoute("PARTNER_SERVICE", "/permintaan", "produk").allowed, false);
    assert.equal(canAccessRoute("PARTNER_PRODUCT", "/permintaan/lihat/PMT-0001", "produk").allowed, false);
    assert.equal(canAccessRoute("PARTNER_PRODUCT", "/penawaran", "produk").allowed, false);
    assert.equal(canAccessRoute("PARTNER_PRODUCT", "/penawaran/tambah", "produk").allowed, false);
    assert.equal(canAccessRoute("PARTNER_PRODUCT", "/penawaran/lihat/QUO-005", "produk").allowed, false);
    assert.equal(canAccessRoute("PARTNER_PRODUCT", "/produk", "produk").allowed, true);
  });

  it("memblokir akses langsung ADMIN ke /permintaan & /penawaran secara konsisten (dev maupun production)", () => {
    const menus = getVisibleSidebarMenus("ADMIN", null);
    assert.deepEqual(menus.map((m) => m.href), ["/produk", "/pelanggan"]);
    assert.equal(canAccessRoute("ADMIN", "/permintaan", null).allowed, false);
    assert.equal(canAccessRoute("ADMIN", "/permintaan/lihat/PMT-0001", null).allowed, false);
    assert.equal(canAccessRoute("ADMIN", "/penawaran", null).allowed, false);
    assert.equal(canAccessRoute("ADMIN", "/penawaran/tambah", null).allowed, false);
    assert.equal(canAccessRoute("ADMIN", "/penawaran/lihat/QUO-005", null).allowed, false);
    assert.equal(canAccessRoute("ADMIN", "/produk", null).allowed, true);
    assert.equal(canAccessRoute("ADMIN", "/pelanggan", null).allowed, true);
  });

  it("menampilkan menu khusus Customer (Penawaran saya, Invoice saya, Pesanan saya) dan membatasi rute Partner", () => {
    const resolved = resolveRoleFromAuthSession({ role: "customer", name: "Budi" });
    assert.deepEqual(resolved, { role: "CUSTOMER", tipeUsaha: null });

    const menus = getVisibleSidebarMenus("CUSTOMER", null);
    assert.deepEqual(
      menus.map((m) => ({ name: m.name, href: m.href })),
      [
        { name: "Penawaran saya", href: "/penawaran" },
        { name: "Invoice saya", href: "/invoice" },
        { name: "Pesanan saya", href: "/order" },
      ]
    );

    assert.equal(canAccessRoute("CUSTOMER", "/penawaran", null).allowed, true);
    assert.equal(canAccessRoute("CUSTOMER", "/penawaran/lihat/QUO-005", null).allowed, true);
    assert.equal(canAccessRoute("CUSTOMER", "/invoice", null).allowed, true);
    assert.equal(canAccessRoute("CUSTOMER", "/order", null).allowed, true);
    assert.equal(canAccessRoute("CUSTOMER", "/penawaran/tambah", null).allowed, false);
    assert.equal(canAccessRoute("CUSTOMER", "/permintaan", null).allowed, false);
    assert.equal(canAccessRoute("CUSTOMER", "/produk", null).allowed, false);
    assert.equal(canAccessRoute("CUSTOMER", "/pelanggan", null).allowed, false);
  });

  it("mengizinkan seluruh menu modul penjualan untuk Partner Jasa (tipe_usaha = jasa)", () => {
    assert.equal(normalizeTipeUsaha("Jasa"), "jasa");
    assert.equal(normalizeTipeUsaha("Produk"), "produk");
    const menus = getVisibleSidebarMenus("PARTNER_SERVICE", "jasa");
    assert.deepEqual(
      menus.map((m) => m.href),
      ["/produk", "/pelanggan", "/permintaan", "/penawaran", "/invoice", "/order"]
    );
    assert.equal(canAccessRoute("PARTNER_SERVICE", "/permintaan", "jasa").allowed, true);
    assert.equal(canAccessRoute("PARTNER_SERVICE", "/penawaran/tambah", "jasa").allowed, true);
  });
});

describe("PRO-309: Parser error 409 Pelanggan (TC-M4US1-06)", () => {
  it("membaca amplop backend json.error.code untuk DUPLICATE_EMAIL dan DUPLICATE_PHONE (HTTP 409)", () => {
    const dupEmail = parseCustomerApiError(409, {
      success: false,
      error: {
        code: "DUPLICATE_EMAIL",
        message: "Email sudah terdaftar untuk pelanggan lain.",
        fields: { email: "Email sudah digunakan." },
      },
    });
    assert.equal(dupEmail.field, "email");
    assert.equal(dupEmail.error, "Email sudah digunakan.");

    const dupPhone = parseCustomerApiError(409, {
      success: false,
      error: {
        code: "DUPLICATE_PHONE",
        message: "Nomor telepon sudah terdaftar.",
        fields: null,
      },
    });
    assert.equal(dupPhone.field, "phone");
    assert.equal(dupPhone.error, "Nomor telepon sudah terdaftar.");
  });

  it("tetap mendukung field validation error 400/422 dan format legacy json.code", () => {
    const legacy = parseCustomerApiError(409, { code: "DUPLICATE_EMAIL" });
    assert.equal(legacy.field, "email");
    assert.ok(legacy.error.toLowerCase().includes("email"));

    const validation = parseCustomerApiError(400, {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input tidak valid",
        fields: { address: "Alamat wajib diisi." },
      },
    });
    assert.equal(validation.field, "address");
    assert.equal(validation.error, "Alamat wajib diisi.");
  });
});

describe("PRO-309: Default PPN 11% Round-Half-Up di UI Penawaran (TC-M4US2-06)", () => {
  it("menggunakan default tarif PPN 11% dan menghitung pajak per baris dengan pembulatan Round-Half-Up", () => {
    assert.equal(DEFAULT_PPN_RATE, 11);
    assert.equal(calculateLineTaxRupiah(2_500_000), 275_000);
    assert.equal(calculateLineTaxRupiah(50, 11), 6); // 5.5 -> Round-Half-Up = 6
    assert.equal(calculateLineTaxRupiah(100, 0), 0);

    const summary = calculateQuotationTaxSummary([
      { subtotal: 2_500_000 },
      { subtotal: 1_500_000 },
    ]);
    assert.equal(summary.subtotal, 4_000_000);
    assert.equal(summary.taxAmount, 440_000);
    assert.equal(summary.totalAmount, 4_440_000);
  });
});
