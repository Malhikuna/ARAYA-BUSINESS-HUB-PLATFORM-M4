"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { CustomerPortalDevToggle } from "@/components/common/CustomerPortalDevToggle";
import { CustomerInvoiceList } from "@/components/invoice/CustomerInvoiceList";
import { PartnerInvoiceTable } from "@/components/invoice/PartnerInvoiceTable";
import { MidtransSnapModal } from "@/components/invoice/MidtransSnapModal";
import { InvoiceFilterStatus, InvoiceRecord } from "@/types/invoice-order";
import { useCustomerPortalMode } from "@/lib/auth/customer-portal";
import { normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";
import {
  completeSandboxInvoicePayment,
  fetchInvoicesForViewerApi,
  initiateMidtransPaymentApi,
} from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

export default function InvoicePage() {
  const { isCustomer, customerUserId, isDevPreviewAvailable, toggleCustomerPreview } =
    useCustomerPortalMode();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilterStatus>("ALL");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [snapModalInvoice, setSnapModalInvoice] = useState<InvoiceRecord | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [awaitingWebhookNumber, setAwaitingWebhookNumber] = useState<string | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [toast, setToast] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({ status: "hidden", title: "", description: "" });

  const refreshInvoices = useCallback(async () => {
    setIsRefreshingStatus(true);
    try {
      const list = await fetchInvoicesForViewerApi(isCustomer, customerUserId);
      setInvoices(list);
      return list;
    } finally {
      setIsRefreshingStatus(false);
    }
  }, [isCustomer, customerUserId]);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchInvoicesForViewerApi(isCustomer, customerUserId).then((list) => {
        if (active) setInvoices(list);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, [isCustomer, customerUserId]);

  const handleSyncAfterSnap = useCallback(
    async (invoiceId: string, invoiceNumber: string) => {
      const refreshed = await refreshInvoices();
      const latest = refreshed.find(
        (item) => item.id === invoiceId || item.invoice_number === invoiceNumber
      );
      if (latest && normalizeInvoiceStatus(latest.status) === "PAID") {
        setAwaitingWebhookNumber(null);
        setToast({
          status: "visible",
          title: "Pembayaran terkonfirmasi",
          description: `Status ${invoiceNumber} telah diperbarui menjadi Lunas dari server.`,
        });
      } else {
        setAwaitingWebhookNumber(invoiceNumber);
        setToast({
          status: "visible",
          title: "Menunggu konfirmasi webhook",
          description: `Pembayaran ${invoiceNumber} sedang diverifikasi Midtrans. Klik Perbarui status untuk mengecek ulang.`,
        });
      }
    },
    [refreshInvoices]
  );

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return invoices.filter((inv) => {
      const canonical = normalizeInvoiceStatus(inv.status);
      const matchStatus = statusFilter === "ALL" || canonical === statusFilter;
      const matchQuery =
        !q ||
        `${inv.invoice_number} ${inv.title} ${inv.partner_name} ${inv.customer_name} ${inv.order_number || ""}`
          .toLowerCase()
          .includes(q);
      return matchStatus && matchQuery;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handlePayInvoice = async (invoice: InvoiceRecord) => {
    if (payingInvoiceId) return;
    setPayingInvoiceId(invoice.id);
    try {
      const result = await initiateMidtransPaymentApi(invoice);
      if (result.mode === "error") {
        setToast({
          status: "visible",
          title: "Tidak dapat memulai pembayaran",
          description: result.message,
        });
        return;
      }

      if (result.mode === "snap") {
        if (typeof window !== "undefined" && window.snap?.pay) {
          window.snap.pay(result.snapToken, {
            onSuccess: () => {
              void handleSyncAfterSnap(invoice.id, invoice.invoice_number);
            },
            onPending: () => {
              setAwaitingWebhookNumber(invoice.invoice_number);
              setToast({
                status: "visible",
                title: "Menunggu pembayaran",
                description: `Selesaikan transaksi ${invoice.invoice_number} di Midtrans lalu klik Perbarui status.`,
              });
            },
            onError: () => {
              setToast({
                status: "visible",
                title: "Pembayaran gagal. Silakan coba lagi.",
                description: `Status ${invoice.invoice_number} tetap Belum lunas (BR-08).`,
              });
            },
          });
          return;
        }
        if (result.redirectUrl) {
          setAwaitingWebhookNumber(invoice.invoice_number);
          window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
          return;
        }
        setToast({
          status: "visible",
          title: "Midtrans Snap belum termuat",
          description: "Muat ulang halaman lalu coba klik Bayar kembali.",
        });
        return;
      }

      if (result.mode === "sandbox_fallback") {
        setSnapModalInvoice(invoice);
      }
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleConfirmSandboxPaid = (paymentMethod: string) => {
    if (!snapModalInvoice) return;
    setIsConfirmingPayment(true);
    try {
      const paid = completeSandboxInvoicePayment(snapModalInvoice.id, paymentMethod);
      setSnapModalInvoice(null);
      if (paid) {
        setToast({
          status: "visible",
          title: "Pembayaran berhasil",
          description: `Invoice ${paid.invoice_number} otomatis berstatus Lunas via ${paymentMethod}.`,
        });
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleSimulateSandboxFailed = () => {
    if (!snapModalInvoice) return;
    const invNum = snapModalInvoice.invoice_number;
    setSnapModalInvoice(null);
    setToast({
      status: "visible",
      title: "Pembayaran gagal. Silakan coba lagi.",
      description: `Transaksi ${invNum} dibatalkan atau ditolak. Status invoice tetap Belum lunas (BR-08).`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <ToastNotification
        status={toast.status}
        title={toast.title}
        description={toast.description}
        onDismiss={() => setToast((prev) => ({ ...prev, status: "hidden" }))}
      />

      <Breadcrumb items={[{ label: isCustomer ? "Invoice saya" : "Invoice" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-slate-900">
            {isCustomer ? "Invoice saya" : "Daftar invoice"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCustomer
              ? "Daftar tagihan resmi atas pesanan Anda beserta pembayaran langsung melalui Midtrans Snap."
              : "Pantau status tagihan invoice dan pelunasan otomatis dari Midtrans."}
          </p>
        </div>

        {isDevPreviewAvailable && (
          <CustomerPortalDevToggle isCustomer={isCustomer} onToggle={toggleCustomerPreview} />
        )}
      </div>

      {awaitingWebhookNumber && (
        <div
          role="status"
          className="rounded-2xl border border-sky-200 bg-[#eaf8fe] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950"
        >
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0e7490] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Menunggu konfirmasi webhook Midtrans</strong> untuk invoice{" "}
              <span className="font-mono font-bold">{awaitingWebhookNumber}</span>. Status Lunas akan
              terbarui otomatis dari server setelah notifikasi settlement diterima (BR-08).
            </p>
          </div>
          <button
            type="button"
            disabled={isRefreshingStatus}
            onClick={() => void handleSyncAfterSnap("", awaitingWebhookNumber)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-[#0c4a6e] font-semibold cursor-pointer shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? "animate-spin" : ""}`} />
            <span>{isRefreshingStatus ? "Memeriksa..." : "Perbarui status"}</span>
          </button>
        </div>
      )}

      {isCustomer ? (
        <CustomerInvoiceList
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          payingInvoiceId={payingInvoiceId}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPayInvoice={(inv) => void handlePayInvoice(inv)}
        />
      ) : (
        <PartnerInvoiceTable
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      <MidtransSnapModal
        open={Boolean(snapModalInvoice)}
        invoice={snapModalInvoice}
        isProcessing={isConfirmingPayment}
        onConfirmPaid={handleConfirmSandboxPaid}
        onSimulateFailed={handleSimulateSandboxFailed}
        onClose={() => !isConfirmingPayment && setSnapModalInvoice(null)}
      />
    </div>
  );
}
