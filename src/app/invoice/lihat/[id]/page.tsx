"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { InvoiceDetailBody } from "@/components/invoice/InvoiceDetailBody";
import { InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import {
  formatDateId,
  formatDateTimeWib,
  normalizeInvoiceStatus,
} from "@/lib/invoice-order-helpers";
import { fetchPartnerInvoicesApi } from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

function DetailInvoiceContent() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id ? decodeURIComponent(params.id) : "";

  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLatestInvoice = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await fetchPartnerInvoicesApi();
      const found =
        list.find(
          (item) =>
            item.id.toLowerCase() === invoiceId.toLowerCase() ||
            item.invoice_number.toLowerCase() === invoiceId.toLowerCase()
        ) || null;
      setInvoice(found);
      setIsLoaded(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchPartnerInvoicesApi().then((list) => {
        if (!active) return;
        const found =
          list.find(
            (item) =>
              item.id.toLowerCase() === invoiceId.toLowerCase() ||
              item.invoice_number.toLowerCase() === invoiceId.toLowerCase()
          ) || null;
        setInvoice(found);
        setIsLoaded(true);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, [invoiceId]);

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
            Data invoice tidak tersedia di sistem.
          </p>
        </div>
        <Link
          href="/invoice"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          Kembali ke daftar invoice
        </Link>
      </div>
    );
  }

  const isPaid = normalizeInvoiceStatus(invoice.status) === "PAID";

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb
        items={[
          { label: "Invoice", href: "/invoice" },
          { label: invoice.invoice_number },
        ]}
        separator="/"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink href="/invoice" label="Kembali ke daftar invoice" />
        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void fetchLatestInvoice()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0e7490] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Memeriksa..." : "Perbarui status"}</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              Invoice {invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-slate-500">
            {invoice.title} | {invoice.customer_name}
          </p>
        </div>

        <div className="bg-[#eef4ff] rounded-xl px-4 py-2.5 text-right shrink-0">
          <span className="text-[11px] text-slate-500 block">Total tagihan</span>
          <span className="text-lg sm:text-xl font-heading font-bold text-[#19376d]">
            {formatRupiah(invoice.total_amount)}
          </span>
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
            Invoice belum dilunasi (jatuh tempo <strong>{formatDateId(invoice.due_date)}</strong>).
            Status akan berubah menjadi Lunas secara otomatis setelah notifikasi webhook Midtrans
            valid diterima (BR-08), lalu order terkait dapat diproses (Aturan U-01).
          </p>
        </div>
      )}

      {/* Rincian Partner, Dokumen & Item Tagihan */}
      <InvoiceDetailBody invoice={invoice} />
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
