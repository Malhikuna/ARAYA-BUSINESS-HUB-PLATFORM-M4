"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationDetailHeader } from "@/components/penawaran/QuotationDetailHeader";
import { QuotationDetailInfoCard } from "@/components/penawaran/QuotationDetailInfoCard";
import { QuotationDetailSidebar } from "@/components/penawaran/QuotationDetailSidebar";
import { QuotationPrintDocument } from "@/components/penawaran/QuotationPrintDocument";
import { QuotationEditModal } from "@/components/penawaran/QuotationEditModal";
import {
  QuotationCustomerApproveModal,
  QuotationCustomerStatusBanner,
  QuotationPartnerApprovedBanner,
  QuotationViewerDevToggle,
} from "@/components/penawaran/QuotationCustomerActions";
import { useDevRole } from "@/lib/auth/dev-role";
import { useQuotationViewerMode } from "@/lib/auth/customer-session";
import { downloadQuotationDetailPdf } from "@/lib/export-quotation-pdf";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  findQuotationById,
  saveUpdatedQuotationToStorage,
  formatWaktuPembaruan,
  formatTanggalIndo,
  normalizeQuotationStatus,
} from "@/lib/data/mock-quotations";
import {
  approveQuotationByCustomerApi,
  buildCustomerToPartnerWhatsAppUrl,
  fetchQuotationDetailForViewerApi,
  sendQuotationViaWhatsAppApi,
} from "@/lib/data/quotation-workflow-api";

function LihatPenawaranContent() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useDevRole();
  const { isCustomer, isDevPreviewAvailable, toggleCustomerPreview } = useQuotationViewerMode();
  const quotationId = typeof params?.id === "string" ? params.id : "";

  const [quotation, setQuotation] = useState<Quotation | null>(() =>
    quotationId ? findQuotationById(quotationId) : null
  );
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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
      fetchQuotationDetailForViewerApi(quotationId, isCustomer ? "customer" : "partner").then(
        (dbItem) => {
          if (dbItem) setQuotation(dbItem);
        }
      );
    }
  }, [quotationId, isCustomer]);

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

  const canonicalStatus = normalizeQuotationStatus(quotation.status);
  const isDraft = canonicalStatus === "DRAFT";
  const isApproved = canonicalStatus === "APPROVED";
  const isSent = canonicalStatus === "SENT";

  // Aksi Kirim / Kirim Ulang ke WhatsApp (UC-04 / M4-US2-AC5):
  // Selalu memanggil POST /send-whatsapp (idempotent 200 saat sudah Terkirim tanpa menimpa sent_at).
  const handleSendToWhatsApp = async () => {
    if (isSendingWa) return;
    setIsSendingWa(true);
    try {
      const result = await sendQuotationViaWhatsAppApi(quotation, profile.name);
      if (!result.ok) {
        setToastState({
          status: "visible",
          title: "Gagal mengirim ke WhatsApp",
          description: result.message,
        });
        return;
      }

      setQuotation(result.data);
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setToastState({
        status: "visible",
        title: isDraft ? "Penawaran Terkirim" : "Tautan WhatsApp Dibuka",
        description: isDraft
          ? `Status ${quotation.quotation_number} diperbarui ke Terkirim dan tautan WhatsApp dibuka.`
          : `Penawaran ${quotation.quotation_number} dikirim ulang melalui WhatsApp.`,
      });
    } finally {
      setIsSendingWa(false);
    }
  };

  // Aksi Customer login M1 menyetujui penawaran berstatus Terkirim (UC-05 / M4-US2-AC3)
  const handleConfirmCustomerApprove = async () => {
    if (!isCustomer || !isSent || isApproving) return;
    setIsApproving(true);
    try {
      const result = await approveQuotationByCustomerApi(quotation);
      setIsApproveModalOpen(false);
      if (!result.ok) {
        setToastState({
          status: "visible",
          title: "Persetujuan gagal diproses",
          description: result.message,
        });
        return;
      }

      setQuotation(result.data);
      setShowInvoiceAlert(false);
      setToastState({
        status: "visible",
        title: "Penawaran disetujui.",
        description: `Partner ${profile.name} telah menerima persetujuan Anda.`,
      });
    } finally {
      setIsApproving(false);
    }
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

  const createdTimestamp = quotation.created_at || quotation.createdAt;
  const updatedTimestamp = quotation.updated_at || createdTimestamp;
  const approvedAtLabel = quotation.approved_at || quotation.updated_at
    ? formatWaktuPembaruan(quotation.approved_at || quotation.updated_at)
    : undefined;
  const customerContactPartnerWaUrl = buildCustomerToPartnerWhatsAppUrl({
    partnerPhone: quotation.partner_phone,
    partnerName: quotation.partner_name,
    customerName: quotation.customer_name,
    quotationNumber: quotation.quotation_number,
    title: quotation.permintaan_title || quotation.items[0]?.name || "layanan jasa",
  });

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
            items={[
              { label: isCustomer ? "Penawaran saya" : "Penawaran", href: "/penawaran" },
              { label: `Penawaran ${quotation.quotation_number}` },
            ]}
            separator="/"
            className="mb-0"
          />
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isDraft
                ? createdTimestamp
                  ? `Dibuat: ${formatWaktuPembaruan(createdTimestamp)}`
                  : `Dibuat: ${formatTanggalIndo(quotation.quotation_date)}`
                : updatedTimestamp
                ? `Terakhir diperbarui: ${formatWaktuPembaruan(updatedTimestamp)}`
                : `Tanggal: ${formatTanggalIndo(quotation.quotation_date)}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <BackLink
            href="/penawaran"
            label={isCustomer ? "Kembali ke penawaran saya" : "Kembali ke daftar penawaran"}
          />
          {isDevPreviewAvailable && (
            <QuotationViewerDevToggle
              isCustomer={isCustomer}
              onToggle={toggleCustomerPreview}
            />
          )}
        </div>

        {/* Header Halaman & Tombol Aksi (Partner Jasa vs Customer M1) */}
        <QuotationDetailHeader
          quotationNumber={quotation.quotation_number}
          canonicalStatus={canonicalStatus}
          isCustomer={isCustomer}
          isSendingWa={isSendingWa}
          isApproving={isApproving}
          onEdit={() => setIsEditOpen(true)}
          onCreateInvoice={handleCreateInvoice}
          onSendWhatsApp={() => void handleSendToWhatsApp()}
          onRequestCustomerApprove={() => setIsApproveModalOpen(true)}
        />

        {/* Banner Informasi Khusus Customer M1 (untuk status Draf/Terkirim di atas) */}
        {isCustomer && !isApproved && (
          <QuotationCustomerStatusBanner
            status={canonicalStatus}
            quotationNumber={quotation.quotation_number}
          />
        )}

        {/* Banner Hijau Partner Jasa saat Customer telah menyetujui penawaran (UC-05 -> UC-06) */}
        {!isCustomer && isApproved && (
          <QuotationPartnerApprovedBanner
            customerName={quotation.customer_name}
            approvedAtLabel={approvedAtLabel}
            onCreateInvoice={handleCreateInvoice}
          />
        )}

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
          <div className="lg:col-span-8 space-y-6">
            <QuotationDetailInfoCard quotation={quotation} />

            {/* Kartu Penawaran Berhasil Disetujui khusus Customer M1 di bawah rincian (UC-05) */}
            {isCustomer && isApproved && (
              <QuotationCustomerStatusBanner
                status={canonicalStatus}
                quotationNumber={quotation.quotation_number}
                approvedAtLabel={approvedAtLabel}
                whatsAppUrl={customerContactPartnerWaUrl}
              />
            )}
          </div>

          <div className="lg:col-span-4">
            <QuotationDetailSidebar
              quotation={quotation}
              isCustomer={isCustomer}
              isSendingWa={isSendingWa}
              onSendToWhatsApp={() => void handleSendToWhatsApp()}
              onCreateInvoice={handleCreateInvoice}
              onDownloadPdf={() => setIsExportOpen(true)}
              onPrint={() => window.print()}
            />
          </div>
        </div>

        {/* Modal Konfirmasi Persetujuan Customer (UC-05) */}
        <QuotationCustomerApproveModal
          open={isApproveModalOpen}
          quotation={quotation}
          isSubmitting={isApproving}
          onConfirm={() => void handleConfirmCustomerApprove()}
          onCancel={() => !isApproving && setIsApproveModalOpen(false)}
        />

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
          onConfirmDownload={() => {
            downloadQuotationDetailPdf(quotation);
            setIsExportOpen(false);
          }}
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
