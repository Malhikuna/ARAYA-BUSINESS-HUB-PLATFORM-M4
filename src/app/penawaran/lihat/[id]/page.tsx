"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, CheckCircle2, ReceiptText } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationDetailInfoCard } from "@/components/penawaran/QuotationDetailInfoCard";
import { QuotationDetailSidebar } from "@/components/penawaran/QuotationDetailSidebar";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  findQuotationById,
  fetchQuotationDetailFromDatabase,
  approveQuotationInStorage,
  formatTanggalIndo,
  formatWaktuPembaruan,
} from "@/lib/data/mock-quotations";

function LihatPenawaranContent() {
  const router = useRouter();
  const params = useParams();
  const quotationId = typeof params?.id === "string" ? params.id : "";

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewDateLabel, setPreviewDateLabel] = useState("28 Oktober 2026");
  const [showInvoiceAlert, setShowInvoiceAlert] = useState(false);
  const [alertKey, setAlertKey] = useState(0);
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
      const localItem = findQuotationById(quotationId);
      if (localItem) setQuotation(localItem);

      // Ambil data terbaru langsung dari database PostgreSQL
      fetchQuotationDetailFromDatabase(quotationId).then((dbItem) => {
        if (dbItem) setQuotation(dbItem);
      });
    }
  }, [quotationId]);

  if (!quotation) {
    return (
      <div className="space-y-6 pb-12">
        <Breadcrumb items={[{ label: "Penawaran", href: "/penawaran" }, { label: "Tidak Ditemukan" }]} />
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
    setShowInvoiceAlert(false);
    setToastState({
      status: "visible",
      title: "Penawaran disetujui",
      description: "Invoice sekarang dapat dibuat.",
    });
  };

  const handleCreateInvoice = () => {
    if (!isApproved) {
      setShowInvoiceAlert(true);
      setAlertKey((prev) => prev + 1);
      return;
    }
    router.push(`/invoice?quotation_id=${quotation.id}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <ToastNotification
        status={toastState.status}
        title={toastState.title}
        description={toastState.description}
        onDismiss={() => setToastState((prev) => ({ ...prev, status: "hidden" }))}
      />

      {/* Top Bar: Breadcrumb di kiri, Terakhir diperbarui di kanan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Breadcrumb
          items={[
            { label: "Penawaran", href: "/penawaran" },
            { label: quotation.quotation_number },
          ]}
          separator="/"
          className="mb-0"
        />

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Terakhir diperbarui: {formatWaktuPembaruan(quotation.updated_at || quotation.createdAt)}
          </span>
        </div>
      </div>

      {/* Navigasi Kembali ke Daftar Penawaran */}
      <BackLink href="/penawaran" label="Kembali ke daftar penawaran" />

      {/* Header Halaman: Judul, Status Badge & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Penawaran {quotation.quotation_number}
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

        <div className="flex items-center gap-2.5">
          {/* Tombol Buat Invoice */}
          <button
            type="button"
            onClick={handleCreateInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <ReceiptText className="w-4 h-4 text-slate-500" />
            <span>Buat invoice</span>
          </button>

          {/* Tombol Setujui */}
          {!isApproved && (
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#19376d] hover:bg-[#122852] shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Peringatan: Invoice Belum Dapat Dibuat (Auto-dismiss 5 detik standar UX) */}
      <FormAlertBanner
        key={alertKey}
        visible={showInvoiceAlert}
        title="Invoice belum dapat dibuat"
        description={"Penawaran belum disetujui.\nSetujui penawaran terlebih dahulu."}
        autoDismissMs={5000}
        onClose={() => setShowInvoiceAlert(false)}
        className=""
      />

      {/* Grid Layout Detail 2 Kolom (8 vs 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Informasi Penawaran & Tabel Rincian */}
        <div className="lg:col-span-8">
          <QuotationDetailInfoCard quotation={quotation} />
        </div>

        {/* Kolom Kanan: Ringkasan Dokumen & Riwayat Aktivitas */}
        <div className="lg:col-span-4">
          <QuotationDetailSidebar
            quotation={quotation}
            onDownloadPdf={() => setIsExportOpen(true)}
            onPrint={() => window.print()}
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
