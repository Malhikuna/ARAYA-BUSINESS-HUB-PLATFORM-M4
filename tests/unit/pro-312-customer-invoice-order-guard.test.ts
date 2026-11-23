import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_PORTAL_MENUS,
  canCustomerViewRecord,
  evaluateOrderProcessGuard,
  getInvoiceStatusLabel,
  getOrderStatusLabel,
  normalizeInvoiceStatus,
  normalizeOrderStatus,
} from "@/lib/invoice-order-helpers";
import { resolveCustomerPortalFromSnapshot } from "@/lib/auth/customer-portal";
import {
  initiateMidtransPaymentApi,
  updatePartnerOrderStatusApi,
} from "@/lib/data/invoice-order-api";
import { initialInvoices, initialOrders } from "@/lib/data/mock-invoices-orders";

describe("PRO-312: Guard U-01, BR-09, BR-10 & Menu Sidebar Customer M1", () => {
  it("Guard U-01 menonaktifkan tombol Proses order jika Invoice terkait belum Lunas", () => {
    const unpaidOrder = initialOrders[0];
    assert.equal(normalizeInvoiceStatus(unpaidOrder.invoice_status), "UNPAID");

    const guard = evaluateOrderProcessGuard(unpaidOrder);
    assert.equal(guard.canProcess, false);
    assert.equal(guard.blockedByUnpaidInvoice, true);
    assert.equal(guard.isFinal, false);
    assert.ok(guard.reason?.includes("Aturan U-01"));
  });

  it("Guard U-01 mengizinkan Proses order jika Invoice sudah Lunas, dan BR-09 mengunci status Selesai", () => {
    const paidBaruOrder = initialOrders[1];
    const guardBaru = evaluateOrderProcessGuard(paidBaruOrder);
    assert.equal(guardBaru.canProcess, true);
    assert.equal(guardBaru.blockedByUnpaidInvoice, false);

    const diprosesOrder = initialOrders[2];
    const guardDiproses = evaluateOrderProcessGuard(diprosesOrder);
    assert.equal(guardDiproses.canProcess, false);
    assert.equal(guardDiproses.canComplete, true);

    const selesaiOrder = initialOrders[3];
    const guardSelesai = evaluateOrderProcessGuard(selesaiOrder);
    assert.equal(guardSelesai.isFinal, true);
    assert.equal(guardSelesai.canProcess, false);
    assert.equal(guardSelesai.canComplete, false);
    assert.ok(guardSelesai.reason?.includes("BR-09"));
  });

  it("BR-10 mengisolasi data Invoice & Pesanan berdasarkan akun Customer login M1 tanpa Guest Tracking", () => {
    assert.equal(canCustomerViewRecord("user-a", "user-a"), true);
    assert.equal(canCustomerViewRecord("user-a", "user-b"), false);
    assert.equal(canCustomerViewRecord("user-a", null), false);
    assert.equal(getInvoiceStatusLabel("belum_lunas"), "Belum lunas");
    assert.equal(getInvoiceStatusLabel("PAID"), "Lunas");
    assert.equal(getOrderStatusLabel(normalizeOrderStatus("diproses")), "Diproses");
  });

  it("Sidebar Customer M1 hanya menampilkan 3 menu berakhiran 'saya' tanpa halaman Katalog", () => {
    assert.deepEqual(
      CUSTOMER_PORTAL_MENUS.map((m) => m.name),
      ["Penawaran saya", "Pesanan saya", "Invoice saya"]
    );
    assert.equal(
      CUSTOMER_PORTAL_MENUS.some((m) => String(m.href) === "/produk"),
      false
    );

    const sessionCustomer = resolveCustomerPortalFromSnapshot({
      isDevSwitcherEnabled: false,
      devActiveRole: null,
      authSessionRole: "Customer",
      authSessionUserId: "cust-123",
      authSessionName: "Budi Santoso",
      customerPreviewEnabled: false,
    });
    assert.equal(sessionCustomer.isCustomer, true);
    assert.equal(sessionCustomer.customerUserId, "cust-123");
  });
});

describe("PRO-312: API Client Midtrans Snap (UC-07) & Guard U-01 PATCH Order Status (UC-08)", () => {
  it("initiateMidtransPaymentApi mengembalikan snap_token dari POST /api/m4/v1/invoices/[id]/payments dan menolak invoice Lunas", async () => {
    const unpaidInv = initialInvoices[0];
    const paidInv = initialInvoices[1];

    const paidResult = await initiateMidtransPaymentApi(paidInv);
    assert.equal(paidResult.mode, "error");

    const mockFetch: typeof fetch = async (input) => {
      assert.ok(String(input).includes(`/api/m4/v1/invoices/${unpaidInv.id}/payments`));
      return new Response(
        JSON.stringify({
          success: true,
          data: { snap_token: "snap-token-live-001", redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/abc" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const liveResult = await initiateMidtransPaymentApi(unpaidInv, mockFetch);
    assert.equal(liveResult.mode, "snap");
    if (liveResult.mode === "snap") {
      assert.equal(liveResult.snapToken, "snap-token-live-001");
    }

    const notFoundFetch: typeof fetch = async () => new Response("Not Found", { status: 404 });
    const fallbackResult = await initiateMidtransPaymentApi(unpaidInv, notFoundFetch);
    assert.equal(fallbackResult.mode, "sandbox_fallback");
  });

  it("updatePartnerOrderStatusApi memblokir panggilan API bila Invoice belum Lunas (U-01) dan memanggil PATCH saat sudah Lunas", async () => {
    let fetchCalled = false;
    const spyFetch: typeof fetch = async (input, init) => {
      fetchCalled = true;
      assert.ok(String(input).endsWith(`/api/m4/v1/orders/${initialOrders[1].id}/status`));
      assert.equal(init?.method, "PATCH");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    // Unpaid order -> Guard U-01 menolak SEBELUM memanggil API
    const blocked = await updatePartnerOrderStatusApi(initialOrders[0], "diproses", "Rani K.", spyFetch);
    assert.equal(blocked.ok, false);
    assert.equal(fetchCalled, false);

    // Paid order -> memanggil PATCH /api/m4/v1/orders/[id]/status
    const allowed = await updatePartnerOrderStatusApi(initialOrders[1], "diproses", "Rani K.", spyFetch);
    assert.equal(allowed.ok, true);
    assert.equal(fetchCalled, true);
  });
});
