"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, CheckCircle2, ReceiptText, Pencil, MessageCircle } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationDetailInfoCard } from "@/components/penawaran/QuotationDetailInfoCard";
import { QuotationDetailSidebar } from "@/components/penawaran/QuotationDetailSidebar";
import { QuotationPrintDocument } from "@/components/penawaran/QuotationPrintDocument";
import { QuotationEditModal } from "@/components/penawaran/QuotationEditModal";
import { Quotation, QuotationStatus } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  findQuotationById,
  fetchQuotationDetailFromDatabase,
  approveQuotationInStorage,
  markQuotationAsSentInStorage,
  saveUpdatedQuotationToStorage,
  formatWaktuPembaruan,
  formatTanggalIndo,
} from "@/lib/data/mock-quotations";

function LihatPenawaranContent() {
  const router = useRouter();
  const params = useParams();
  const quotationId = typeof params?.id === "string" ? params.id : "";

  const [quotation, setQuotation] = useState<Quotation | null>(() =>
    quotationId ? findQuotationById(quotationId) : null
  );
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [previewDateLabel] = useState<string>(() =>
    typeof window === "undefined"
      ? ""
      : new Date().toLocaleDateString("id-ID", { dateStyle: "long" })
  );
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
    if (quotationId) {
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

  const isDraft = quotation.status === "DRAFT";
  const isApproved = quotation.status === "APPROVED";
  const isSent = quotation.status === "PENDING_APPROVAL";

  // Aksi Kirim ke WhatsApp (UC-04: Transisi Draf -> Terkirim)
  const handleSendToWhatsApp = () => {
    const contactName = quotation.customer_name.replace(/^(PT|CV|UD)\s+/i, "").split(" ")[0] || "Budi";
    const pmtTitle = quotation.permintaan_title || quotation.items[0]?.name || "Pendampingan laporan keuangan Q4";
    const validUntilStr = quotation.valid_until ? formatTanggalIndo(quotation.valid_until) : "1 Des 2026";
    const formattedTotal = formatRupiah(quotation.total_amount);
    const cleanPhone = (quotation.customer_phone || "081234567890").replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;

    const waMessage = `Halo ${contactName}, berikut penawaran ${quotation.quotation_number} dari Araya Konsultan untuk ${pmtTitle}. Total ${formattedTotal}, berlaku sampai ${validUntilStr}. Lihat dan setujui di: https://araya.id/penawaran/${quotation.quotation_number}`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`, "_blank");
    markQuotationAsSentInStorage(quotation.id);
    setQuotation((prev) => (prev ? { ...prev, status: "PENDING_APPROVAL" as QuotationStatus } : null));
    setToastState({
      status: "visible",
      title: "Penawaran Terkirim",
      description: `Dokumen ${quotation.quotation_number} berhasil dikirim ke WhatsApp customer.`,
    });
  };

  // Aksi Persetujuan Customer (Simulasi UC-05 untuk kebutuhan demo/review)
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

  // Aksi Buat Invoice (UC-06: Hanya aktif jika status DISESETUJUI)
  const handleCreateInvoice = () => {
    if (!isApproved) {
      setShowInvoiceAlert(true);
      setAlertKey((prev) => prev + 1);
      return;
    }
    router.push(`/invoice?quotation_id=${quotation.id}`);
  };

  const handleSaveEdit = (updated: Quotation) => {
    saveUpdatedQuotationToStorage(updated);
    setQuotation(updated);
    setIsEditOpen(false);
    setToastState({
      status: "visible",
      title: "Perubahan Disimpan",
      description: `Dokumen penawaran ${updated.quotation_number} berhasil diperbarui.`,
    });
  };

  return (
    <>
      <div className="space-y-6 pb-12 print:hidden">
        <ToastNotification
          status={toastState.status}
          title={toastState.title}
          description={toastState.description}
          onDismiss={() => setToastState((prev) => ({ ...prev, status: "hidden" }))}
        />

        {/* Top Bar: Breadcrumb di kiri, Waktu dibuat di kanan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Breadcrumb
            items={[{ label: "Penawaran", href: "/penawaran" }, { label: `Penawaran ${quotation.quotation_number}` }]}
            separator="/"
            className="mb-0"
          />
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isDraft
                ? `Dibuat: ${formatTanggalIndo(quotation.quotation_date)}, 10:05 WIB`
                : `Terakhir diperbarui: ${formatWaktuPembaruan(quotation.updated_at || quotation.createdAt)}`}
            </span>
          </div>
        </div>

        <BackLink href="/penawaran" label="Kembali ke daftar penawaran" />

        {/* Header Halaman Sesuai Desain Figma */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
                Penawaran {quotation.quotation_number}
              </h1>
              {isDraft ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Draf</span>
                </span>
              ) : isSent ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Terkirim</span>
                </span>
              ) : isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Disetujui</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Action Buttons Header Sesuai Status & Figma */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {isDraft && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                <span>Ubah</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={!isApproved}
              title={isApproved ? "Buat tagihan invoice" : "Invoice hanya dapat dibuat setelah penawaran disetujui customer (BR-07)"}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                isApproved
                  ? "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                  : "border-slate-100 text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
              }`}
            >
              <ReceiptText className="w-4 h-4 text-slate-400" />
              <span>Buat invoice</span>
            </button>

            {isDraft ? (
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim ke WhatsApp</span>
              </button>
            ) : isSent ? (
              <>
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Kirim ulang</span>
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#19376d] hover:bg-[#122852] shadow-sm transition-colors cursor-pointer"
                  title="Simulasi persetujuan oleh customer (UC-05)"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Banner Peringatan: Invoice Belum Dapat Dibuat */}
        <FormAlertBanner
          key={alertKey}
          visible={showInvoiceAlert}
          title="Invoice belum dapat dibuat"
          description={"Penawaran belum disetujui.\nSetujui penawaran terlebih dahulu."}
          autoDismissMs={5000}
          onClose={() => setShowInvoiceAlert(false)}
        />

        {/* Grid Layout Detail 2 Kolom (8 vs 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <QuotationDetailInfoCard quotation={quotation} />
          </div>

          <div className="lg:col-span-4">
            <QuotationDetailSidebar
              quotation={quotation}
              onSendToWhatsApp={handleSendToWhatsApp}
              onDownloadPdf={() => setIsExportOpen(true)}
              onPrint={() => window.print()}
            />
          </div>
        </div>

        {/* Modal Ubah Penawaran */}
        <QuotationEditModal
          quotation={isEditOpen ? quotation : null}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
        />

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
          columns={[{ header: "Item" }, { header: "Jumlah", align: "right" }, { header: "Harga Satuan", align: "right" }, { header: "Subtotal", align: "right" }]}
          rows={quotation.items.map((i) => [i.name, `${i.quantity} ${i.unit || "Unit"}`, formatRupiah(i.unit_price), formatRupiah(i.subtotal)])}
          totalItems={quotation.items.length}
          itemLabel="Item"
          onClose={() => setIsExportOpen(false)}
          onConfirmDownload={() => setIsExportOpen(false)}
        />
      </div>

      <QuotationPrintDocument quotation={quotation} />
    </>
  );
}

export default function LihatPenawaranPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Memuat rincian penawaran...</div>}>
      <LihatPenawaranContent />
    </Suspense>
  );
}
