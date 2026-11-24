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
  mapApiInvoiceRowToRecord,
  mapApiOrderRowToRecord,
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

  it("Sidebar Customer M1 menampilkan urutan PRD: Penawaran saya, Invoice saya, Pesanan saya (tanpa Katalog)", () => {
    assert.deepEqual(
      CUSTOMER_PORTAL_MENUS.map((m) => m.name),
      ["Penawaran saya", "Invoice saya", "Pesanan saya"]
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
    const prodBlocked = await initiateMidtransPaymentApi(unpaidInv, notFoundFetch, { allowDevFallback: false });
    assert.equal(prodBlocked.mode, "error");
    if (prodBlocked.mode === "error") assert.equal(prodBlocked.status, 404);

    const networkErrFetch: typeof fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    const prodNetBlocked = await initiateMidtransPaymentApi(unpaidInv, networkErrFetch, { allowDevFallback: false });
    assert.equal(prodNetBlocked.mode, "error");

    const devFallback = await initiateMidtransPaymentApi(unpaidInv, notFoundFetch, { allowDevFallback: true });
    assert.equal(devFallback.mode, "sandbox_fallback");
  });

  it("updatePartnerOrderStatusApi memblokir panggilan API bila Invoice belum Lunas (U-01) dan menolak mutasi mock lokal di production (!isDev)", async () => {
    let fetchCalled = false;
    const spyFetch: typeof fetch = async (input, init) => {
      fetchCalled = true;
      assert.ok(String(input).endsWith(`/api/m4/v1/orders/${initialOrders[1].id}/status`));
      assert.equal(init?.method, "PATCH");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    // Unpaid order -> Guard U-01 menolak SEBELUM memanggil API
    const blocked = await updatePartnerOrderStatusApi(initialOrders[0], "diproses", "Rani K.", spyFetch, {
      allowDevFallback: false,
    });
    assert.equal(blocked.ok, false);
    assert.equal(fetchCalled, false);

    // Paid order -> memanggil PATCH /api/m4/v1/orders/[id]/status
    const allowed = await updatePartnerOrderStatusApi(initialOrders[1], "diproses", "Rani K.", spyFetch, {
      allowDevFallback: false,
    });
    assert.equal(allowed.ok, true);
    assert.equal(fetchCalled, true);

    // Production (!isDev) saat 404 atau network error wajib mengembalikan error jujur (tanpa mutasi lokal palsu)
    const notFoundFetch: typeof fetch = async () => new Response("Not Found", { status: 404 });
    const prodNotFound = await updatePartnerOrderStatusApi(initialOrders[1], "diproses", "Rani K.", notFoundFetch, {
      allowDevFallback: false,
    });
    assert.equal(prodNotFound.ok, false);

    const netErrFetch: typeof fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    const prodNetErr = await updatePartnerOrderStatusApi(initialOrders[1], "diproses", "Rani K.", netErrFetch, {
      allowDevFallback: false,
    });
    assert.equal(prodNetErr.ok, false);
  });

  it("mapper defensif Invoice & Order mengubah Prisma Decimal string dan relasi nested tanpa NaN", () => {
    const mappedInv = mapApiInvoiceRowToRecord({
      id: "inv-uuid-1",
      invoice_number: "INV-202611-0099",
      status: "belum_lunas",
      subtotal: "6500000.00",
      tax_amount: "715000.00",
      total_amount: "7215000.00",
      due_date: "2026-12-01T00:00:00.000Z",
      customers: { id: "cust-1", user_id: "user-17", name: "PT Maju Bersama", email: "budi@maju.co.id" },
      partners: { id: "partner-1", name: "Araya Konsultan" },
      invoice_items: [
        { id: "li-1", description: "Audit Keuangan — Q4", quantity: "2", unit_price: "3250000.00", subtotal: "6500000.00" },
      ],
    });
    assert.equal(mappedInv.subtotal, 6500000);
    assert.equal(mappedInv.tax_amount, 715000);
    assert.equal(mappedInv.total_amount, 7215000);
    assert.equal(mappedInv.tax_rate, 11);
    assert.equal(mappedInv.customer_user_id, "user-17");
    assert.equal(mappedInv.partner_name, "Araya Konsultan");
    assert.equal(mappedInv.items[0].name, "Audit Keuangan");
    assert.equal(Number.isNaN(mappedInv.total_amount), false);

    const mappedOrd = mapApiOrderRowToRecord({
      id: "ord-uuid-1",
      order_number: "ORD-202611-0099",
      status: "diproses",
      total_amount: "7215000.00",
      customers: { id: "cust-1", user_id: "user-17", name: "PT Maju Bersama" },
      invoices: { id: "inv-uuid-1", invoice_number: "INV-202611-0099", status: "lunas" },
      order_items: [{ id: "oi-1", name: "Audit Keuangan", quantity: "2", unit_price: "3250000.00", subtotal: "6500000.00" }],
    });
    assert.equal(mappedOrd.status, "diproses");
    assert.equal(mappedOrd.invoice_status, "lunas");
    assert.equal(mappedOrd.total_amount, 7215000);
    assert.equal(mappedOrd.customer_user_id, "user-17");
    assert.ok(mappedOrd.timeline.length >= 1);
  });
});
