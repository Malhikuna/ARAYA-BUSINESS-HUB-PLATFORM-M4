"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { CustomerPortalDevToggle } from "@/components/common/CustomerPortalDevToggle";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { InvoiceDetailBody } from "@/components/invoice/InvoiceDetailBody";
import { MidtransSnapModal } from "@/components/invoice/MidtransSnapModal";
import { InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { useCustomerPortalMode } from "@/lib/auth/customer-portal";
import {
  canCustomerViewRecord,
  formatDateId,
  formatDateTimeWib,
  normalizeInvoiceStatus,
} from "@/lib/invoice-order-helpers";
import {
  completeSandboxInvoicePayment,
  fetchInvoicesForViewerApi,
  initiateMidtransPaymentApi,
} from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

function DetailInvoiceContent() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id ? decodeURIComponent(params.id) : "";
  const { isCustomer, customerUserId, isDevPreviewAvailable, toggleCustomerPreview } =
    useCustomerPortalMode();

  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [snapModalOpen, setSnapModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({ status: "hidden", title: "", description: "" });

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchInvoicesForViewerApi(isCustomer, customerUserId).then((list) => {
        if (!active) return;
        const found =
          list.find(
            (item) =>
              item.id.toLowerCase() === invoiceId.toLowerCase() ||
              item.invoice_number.toLowerCase() === invoiceId.toLowerCase()
          ) || null;
        const allowed =
          found && (!isCustomer || canCustomerViewRecord(found.customer_user_id, customerUserId))
            ? found
            : null;
        setInvoice(allowed);
        setIsLoaded(true);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, [invoiceId, isCustomer, customerUserId]);

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat detail invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">Invoice tidak ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Invoice tidak tersedia atau bukan milik akun Anda (BR-10).
          </p>
        </div>
        <Link
          href="/invoice"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          {isCustomer ? "Kembali ke Invoice saya" : "Kembali ke daftar invoice"}
        </Link>
      </div>
    );
  }

  const isPaid = normalizeInvoiceStatus(invoice.status) === "PAID";

  const handleInitiatePayment = async () => {
    if (isPaying || isPaid) return;
    setIsPaying(true);
    try {
      const res = await initiateMidtransPaymentApi(invoice);
      if (res.mode === "error") {
        setToast({ status: "visible", title: "Gagal memulai pembayaran", description: res.message });
        return;
      }
      if (res.mode === "snap" && typeof window !== "undefined" && window.snap?.pay) {
        window.snap.pay(res.snapToken, {
          onSuccess: () => {
            const updated = completeSandboxInvoicePayment(invoice.id, "Midtrans Snap");
            if (updated) setInvoice(updated);
            setToast({
              status: "visible",
              title: "Pembayaran berhasil",
              description: `Invoice ${invoice.invoice_number} kini berstatus Lunas.`,
            });
          },
          onError: () => {
            setToast({
              status: "visible",
              title: "Pembayaran gagal. Silakan coba lagi.",
              description: "Status invoice tetap Belum lunas (BR-08).",
            });
          },
        });
        return;
      }
      if (res.mode === "snap" && res.redirectUrl) {
        window.open(res.redirectUrl, "_blank", "noopener,noreferrer");
        return;
      }
      setSnapModalOpen(true);
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmSandboxPaid = (method: string) => {
    const updated = completeSandboxInvoicePayment(invoice.id, method);
    setSnapModalOpen(false);
    if (updated) {
      setInvoice(updated);
      setToast({
        status: "visible",
        title: "Pembayaran berhasil",
        description: `Invoice ${updated.invoice_number} otomatis berstatus Lunas via ${method}.`,
      });
    }
  };

  const handleSimulateFailed = () => {
    setSnapModalOpen(false);
    setToast({
      status: "visible",
      title: "Pembayaran gagal. Silakan coba lagi.",
      description: `Status ${invoice.invoice_number} tetap Belum lunas (BR-08).`,
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

      <Breadcrumb
        items={[
          { label: isCustomer ? "Invoice saya" : "Invoice", href: "/invoice" },
          { label: invoice.invoice_number },
        ]}
        separator="/"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink
          href="/invoice"
          label={isCustomer ? "Kembali ke Invoice saya" : "Kembali ke daftar invoice"}
        />
        {isDevPreviewAvailable && (
          <CustomerPortalDevToggle isCustomer={isCustomer} onToggle={toggleCustomerPreview} />
        )}
      </div>

      {/* Hero Header Card (responsif, tanpa overlay yang menutupi konten) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              Invoice {invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-slate-500">
            {invoice.title} | {invoice.partner_name}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#eef4ff] rounded-xl px-4 py-2.5 text-right">
            <span className="text-[11px] text-slate-500 block">Total tagihan</span>
            <span className="text-lg sm:text-xl font-heading font-bold text-[#19376d]">
              {formatRupiah(invoice.total_amount)}
            </span>
          </div>

          {isCustomer && !isPaid && (
            <button
              type="button"
              disabled={isPaying}
              onClick={() => void handleInitiatePayment()}
              className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl bg-[#19376d] hover:bg-[#122852] disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isPaying ? "Membuka Midtrans..." : "Bayar sekarang"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Pelunasan Banner */}
      {isPaid ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Invoice telah lunas</p>
            <p className="text-emerald-800">
              Dibayar pada {formatDateTimeWib(invoice.paid_at)} | Metode:{" "}
              {invoice.payment_method || "Midtrans"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Invoice belum dilunasi. Selesaikan pembayaran sebelum{" "}
            <strong>{formatDateId(invoice.due_date)}</strong> agar Partner dapat segera memproses
            pesanan Anda (Aturan U-01).
          </p>
        </div>
      )}

      {/* Rincian Partner, Dokumen & Item Tagihan */}
      <InvoiceDetailBody invoice={invoice} />

      <MidtransSnapModal
        open={snapModalOpen}
        invoice={invoice}
        isProcessing={false}
        onConfirmPaid={handleConfirmSandboxPaid}
        onSimulateFailed={handleSimulateFailed}
        onClose={() => setSnapModalOpen(false)}
      />
    </div>
  );
}

export default function DetailInvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-xs text-slate-500 text-center">Memuat invoice...</div>}>
      <DetailInvoiceContent />
    </Suspense>
  );
}
