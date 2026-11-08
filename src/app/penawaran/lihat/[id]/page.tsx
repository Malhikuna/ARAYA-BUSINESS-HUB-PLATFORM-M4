"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Download, User, Calendar, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationSummarySidebar } from "@/components/penawaran/QuotationSummarySidebar";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  findQuotationById,
  approveQuotationInStorage,
  formatTanggalIndo,
} from "@/lib/data/mock-quotations";

function LihatPenawaranContent() {
  const params = useParams();
  const quotationId = typeof params?.id === "string" ? params.id : "";

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewDateLabel, setPreviewDateLabel] = useState("28 Oktober 2026");
  const [toastState, setToastState] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({
    status: "hidden",
    title: "",
    description: "",
  });

  useEffect(() => {
    setPreviewDateLabel(new Date().toLocaleDateString("id-ID", { dateStyle: "long" }));
    if (quotationId) {
      const item = findQuotationById(quotationId);
      setQuotation(item);
    }
  }, [quotationId]);

  if (!quotation) {
    return (
      <div className="space-y-6 pb-12">
        <BackLink href="/penawaran" label="Kembali ke daftar penawaran" />
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-sm font-semibold text-slate-600">
            Penawaran harga tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = quotation.status === "APPROVED";

  const handleApprove = () => {
    approveQuotationInStorage(quotation.id);
    setQuotation((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
    setToastState({
      status: "visible",
      title: "Penawaran disetujui",
      description: "Status penawaran berhasil disetujui.",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <ToastNotification
        status={toastState.status}
        title={toastState.title}
        description={toastState.description}
        onDismiss={() => setToastState((prev) => ({ ...prev, status: "hidden" }))}
      />

      {/* Navigasi Breadcrumb & BackLink */}
      <Breadcrumb
        items={[
          { label: "Penawaran & tagihan penjualan" },
          { label: "Penawaran", href: "/penawaran" },
          { label: quotation.quotation_number },
        ]}
      />
      <BackLink href="/penawaran" label="Kembali ke daftar penawaran" />

      {/* Header Halaman & Aksi Persetujuan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {quotation.quotation_number}
            </h1>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f7fa] text-[#0e7490]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0e7490]" />
                <span>Disetujui</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3eb] text-[#c25e1a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c25e1a]" />
                <span>Menunggu persetujuan</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diterbitkan untuk {quotation.customer_name} pada {formatTanggalIndo(quotation.quotation_date)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor PDF</span>
          </button>

          {!isApproved && (
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui penawaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout Detail & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Informasi Pelanggan & Tabel Rincian */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Info Pelanggan & Tanggal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Informasi penerima penawaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block">Nama Pelanggan</span>
                  <span className="font-bold text-slate-800">{quotation.customer_name}</span>
                  {quotation.customer_email && (
                    <span className="text-slate-500 block">{quotation.customer_email}</span>
                  )}
                  {quotation.customer_phone && (
                    <span className="text-slate-500 block">{quotation.customer_phone}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block">Masa Berlaku</span>
                  <span className="font-semibold text-slate-800">
                    {formatTanggalIndo(quotation.quotation_date)} s/d {formatTanggalIndo(quotation.valid_until || quotation.quotation_date)}
                  </span>
                  <span className="text-slate-500 block">Validitas 14 hari kalender</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Rincian Item */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Rincian item penawaran
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f0f4fa] text-slate-700 font-semibold border-b border-slate-200/80">
                    <th scope="col" className="px-4 py-3">Produk / Jasa</th>
                    <th scope="col" className="px-4 py-3 text-center">Jumlah</th>
                    <th scope="col" className="px-4 py-3 text-right">Harga satuan</th>
                    <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {item.category} • Satuan: {item.unit || "Unit"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                        {formatRupiah(item.unit_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catatan Operasional */}
            {quotation.notes && (
              <div className="bg-[#f0f4fa] rounded-xl p-4 flex items-start gap-3 text-xs">
                <FileText className="w-4 h-4 text-[#19376d] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Catatan operasional
                  </span>
                  <p className="text-slate-600 mt-0.5">{quotation.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Sidebar Ringkasan */}
        <div className="lg:col-span-4">
          <QuotationSummarySidebar
            itemsCount={quotation.items.length}
            subtotal={quotation.subtotal}
            taxAmount={quotation.tax_amount}
            totalAmount={quotation.total_amount}
            statusLabel={isApproved ? "Disetujui" : "Menunggu"}
            activeStep={isApproved ? 3 : 2}
          />
        </div>
      </div>

      {/* Modal Ekspor PDF */}
      <ExportPdfPreviewModal
        open={isExportOpen}
        title="Pratinjau dokumen PDF penawaran harga"
        documentSubtitle={`Penawaran Resmi ${quotation.quotation_number} — Araya Business Hub`}
        printedAtLabel={previewDateLabel}
        filters={[
          { label: "Nomor Dokumen", value: quotation.quotation_number },
          { label: "Pelanggan", value: quotation.customer_name },
        ]}
        summaryCards={[
          { label: "Total Entri Item", value: `${quotation.items.length} Item`, accent: "navy" },
          { label: "Estimasi Total", value: formatRupiah(quotation.total_amount), accent: "teal", highlightValue: true },
        ]}
        columns={[
          { header: "Item" },
          { header: "Jumlah", align: "right" },
          { header: "Harga Satuan", align: "right" },
          { header: "Subtotal", align: "right" },
        ]}
        rows={quotation.items.map((i) => [
          i.name,
          `${i.quantity} ${i.unit || "Unit"}`,
          formatRupiah(i.unit_price),
          formatRupiah(i.subtotal),
        ])}
        totalItems={quotation.items.length}
        itemLabel="Item"
        onClose={() => setIsExportOpen(false)}
        onConfirmDownload={() => setIsExportOpen(false)}
      />
    </div>
  );
}

export default function LihatPenawaranPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Memuat rincian penawaran...</div>}>
      <LihatPenawaranContent />
    </Suspense>
  );
}
