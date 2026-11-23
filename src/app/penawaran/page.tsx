"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationMetricCards } from "@/components/penawaran/QuotationMetricCards";
import { QuotationFilterBar } from "@/components/penawaran/QuotationFilterBar";
import { QuotationTable } from "@/components/penawaran/QuotationTable";
import { formatRupiah } from "@/lib/format";
import { Quotation, QuotationFilterStatus } from "@/types/quotation";
import {
  initialQuotations,
  getStoredQuotations,
  subscribeQuotationStorage,
  formatTanggalIndo,
  deleteQuotationFromStorage,
  saveUpdatedQuotationToStorage,
  normalizeQuotationStatus,
  getQuotationStatusLabel,
  QUOTATION_TOAST_TYPE_KEY,
  QUOTATION_TOAST_NUMBER_KEY,
} from "@/lib/data/mock-quotations";
import { fetchQuotationsForViewerApi } from "@/lib/data/quotation-workflow-api";
import { useQuotationViewerMode } from "@/lib/auth/customer-session";
import { QuotationViewerDevToggle } from "@/components/penawaran/QuotationCustomerActions";
import { downloadQuotationListPdf } from "@/lib/export-quotation-pdf";
import { updatePermintaanStatus } from "@/lib/data/mock-permintaan";
import { QuotationDeleteModal } from "@/components/penawaran/QuotationDeleteModal";
import { QuotationEditModal } from "@/components/penawaran/QuotationEditModal";
import { matchesQuotationQuery } from "@/lib/search-matchers";

const ITEMS_PER_PAGE = 10;

/**
 * Halaman utama Daftar Penawaran.
 * Menampilkan ringkasan metrik (Draf, Terkirim, Disetujui), tab filter status, tabel penawaran, serta modal PDF.
 */
export default function PenawaranPage() {
  const { isCustomer, isDevPreviewAvailable, toggleCustomerPreview } = useQuotationViewerMode();
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationFilterStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewDateLabel, setPreviewDateLabel] = useState<string>("");
  const [toastState, setToastState] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({
    status: "hidden",
    title: "",
    description: "",
  });

  const handleConfirmDelete = () => {
    if (!quotationToDelete) return;
    const target = quotationToDelete;
    deleteQuotationFromStorage(target.id, target.quotation_number);
    // Penawaran draf dihapus -> permintaan kembali Baru agar dapat ditawar ulang (BR-13: satu permintaan satu penawaran)
    if (target.permintaan_id) updatePermintaanStatus(target.permintaan_id, "Baru");
    setQuotationToDelete(null);
    setToastState({
      status: "visible",
      title: "Penawaran Dihapus",
      description: `Dokumen penawaran ${target.quotation_number} berhasil dihapus.`,
    });
  };

  const handleSaveEdit = (updated: Quotation) => {
    saveUpdatedQuotationToStorage(updated);
    setQuotationToEdit(null);
    setToastState({
      status: "visible",
      title: "Perubahan Disimpan",
      description: `Data penawaran ${updated.quotation_number} berhasil diperbarui.`,
    });
  };

  useEffect(() => {
    // 1. Sinkronkan data dari client storage & tanggal hari ini
    const timer = window.setTimeout(() => {
      setQuotations(getStoredQuotations());
      setPreviewDateLabel(new Date().toLocaleDateString("id-ID", { dateStyle: "long" }));

      // 2. Cek flash toast notification dari session storage
      try {
        const toastType = sessionStorage.getItem(QUOTATION_TOAST_TYPE_KEY);
        const toastNum = sessionStorage.getItem(QUOTATION_TOAST_NUMBER_KEY);
        if (toastType === "created" || toastType === "draft") {
          sessionStorage.removeItem(QUOTATION_TOAST_TYPE_KEY);
          sessionStorage.removeItem(QUOTATION_TOAST_NUMBER_KEY);
          setToastState({
            status: "visible",
            title: toastNum
              ? `Penawaran ${toastNum} tersimpan sebagai draf.`
              : "Penawaran tersimpan sebagai draf.",
            description: "Penawaran siap ditinjau dan dikirimkan ke WhatsApp customer.",
          });
        } else if (toastType === "approved") {
          sessionStorage.removeItem(QUOTATION_TOAST_TYPE_KEY);
          setToastState({
            status: "visible",
            title: "Penawaran disetujui",
            description: "Invoice sekarang dapat dibuat.",
          });
        }
      } catch {
        // ignore
      }
    }, 0);

    // 3. Ambil data resmi dari database PostgreSQL sesuai role (Partner Jasa / Customer M1)
    fetchQuotationsForViewerApi(isCustomer ? "customer" : "partner").then((dbList) => {
      if (dbList.length > 0) {
        setQuotations(dbList);
      }
    });

    const unsubscribe = subscribeQuotationStorage(() => {
      setQuotations(getStoredQuotations());
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [isCustomer]);

  // Customer M1 hanya melihat penawaran yang sudah dikirimkan (bukan Draf internal Partner)
  const visibleQuotations = useMemo(
    () =>
      isCustomer
        ? quotations.filter((q) => normalizeQuotationStatus(q.status) !== "DRAFT")
        : quotations,
    [quotations, isCustomer]
  );

  const metrics = useMemo(() => {
    const draf = visibleQuotations.filter((q) => normalizeQuotationStatus(q.status) === "DRAFT").length;
    const terkirim = visibleQuotations.filter((q) => normalizeQuotationStatus(q.status) === "SENT").length;
    const disetujui = visibleQuotations.filter((q) => normalizeQuotationStatus(q.status) === "APPROVED").length;
    return { draf, terkirim, disetujui };
  }, [visibleQuotations]);

  const effectiveStatusFilter: QuotationFilterStatus =
    isCustomer && statusFilter === "DRAFT" ? "ALL" : statusFilter;

  const filteredData = useMemo(() => {
    const list = visibleQuotations.filter((item) => {
      const matchesSearch = matchesQuotationQuery(item, searchQuery);
      const canonical = normalizeQuotationStatus(item.status);

      const matchesStatus =
        effectiveStatusFilter === "ALL" ||
        (effectiveStatusFilter === "DRAFT" && canonical === "DRAFT") ||
        ((effectiveStatusFilter === "SENT" || effectiveStatusFilter === "PENDING_APPROVAL") && canonical === "SENT") ||
        (effectiveStatusFilter === "APPROVED" && canonical === "APPROVED") ||
        (effectiveStatusFilter === "REJECTED" && canonical === "REJECTED");

      return matchesSearch && matchesStatus;
    });

    // Urutan: Dokumen baru (isNew) di paling atas, kemudian diurutkan berdasarkan tanggal terbaru
    return list.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      const dateCompare = (b.quotation_date || "").localeCompare(a.quotation_date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.quotation_number || "").localeCompare(a.quotation_number || "");
    });
  }, [visibleQuotations, searchQuery, effectiveStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notifikasi Sukses */}
      <ToastNotification
        status={toastState.status}
        title={toastState.title}
        description={toastState.description}
        onDismiss={() => setToastState((prev) => ({ ...prev, status: "hidden" }))}
      />

      {/* Breadcrumb Navigasi */}
      <Breadcrumb items={[{ label: "Penawaran" }]} />

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            {isCustomer ? "Penawaran saya" : "Daftar penawaran"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isCustomer
              ? "Tinjau penawaran jasa yang dikirimkan Partner dan berikan persetujuan Anda."
              : "Penawaran dibuat dari permintaan customer."}
          </p>
        </div>
        {isDevPreviewAvailable && (
          <QuotationViewerDevToggle
            isCustomer={isCustomer}
            onToggle={(next) => {
              toggleCustomerPreview(next);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Kartu Metrik Ringkasan */}
      <QuotationMetricCards
        drafCount={metrics.draf}
        terkirimCount={metrics.terkirim}
        disetujuiCount={metrics.disetujui}
        isCustomer={isCustomer}
        totalCount={visibleQuotations.length}
      />

      {/* Filter Bar (Pencarian, Tab Status & Tombol Ekspor) */}
      <QuotationFilterBar
        searchTerm={searchQuery}
        selectedStatus={effectiveStatusFilter}
        isCustomer={isCustomer}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        onOpenExportPreview={() => setIsExportOpen(true)}
      />

      {/* Tabel Data Penawaran */}
      <QuotationTable
        currentData={currentData}
        filteredCount={filteredData.length}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        isCustomer={isCustomer}
        onPageChange={setCurrentPage}
        onRequestEdit={(item) => setQuotationToEdit(item)}
        onRequestDelete={(item) => setQuotationToDelete(item)}
      />

      {/* Modal Konfirmasi Hapus */}
      <QuotationDeleteModal
        quotation={quotationToDelete}
        onCancel={() => setQuotationToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal Ubah Penawaran */}
      <QuotationEditModal
        quotation={quotationToEdit}
        onClose={() => setQuotationToEdit(null)}
        onSave={handleSaveEdit}
      />

      {/* Modal Ekspor PDF */}
      <ExportPdfPreviewModal
        open={isExportOpen}
        title="Pratinjau laporan PDF daftar penawaran"
        documentSubtitle="Laporan Daftar Penawaran (Quotation) — Modul Penawaran & Tagihan Penjualan"
        printedAtLabel={previewDateLabel}
        filters={[
          {
            label: "Filter Status",
            value:
              statusFilter === "APPROVED"
                ? "Disetujui"
                : statusFilter === "DRAFT"
                ? "Draf"
                : statusFilter === "REJECTED"
                ? "Ditolak"
                : statusFilter === "SENT" || statusFilter === "PENDING_APPROVAL"
                ? "Terkirim"
                : "Semua status",
          },
          { label: "Cari", value: searchQuery.trim() ? `"${searchQuery.trim()}"` : "Semua" },
        ]}
        summaryCards={[
          { label: "Draf", value: `${metrics.draf} Draf`, accent: "navy" },
          { label: "Terkirim", value: `${metrics.terkirim} Terkirim`, accent: "navy", highlightValue: true },
          { label: "Disetujui", value: `${metrics.disetujui} Disetujui`, accent: "teal" },
        ]}
        columns={[
          { header: "Nomor" },
          { header: "Permintaan" },
          { header: "Customer" },
          { header: "Tanggal" },
          { header: "Berlaku Sampai" },
          { header: "Total", align: "right" },
          { header: "Status" },
        ]}
        rows={filteredData.map((d) => [
          d.quotation_number,
          d.permintaan_id ? `${d.permintaan_id} | ${d.permintaan_title || ""}` : "-",
          d.customer_name,
          formatTanggalIndo(d.quotation_date),
          d.valid_until ? formatTanggalIndo(d.valid_until) : "-",
          formatRupiah(d.total_amount),
          getQuotationStatusLabel(d.status),
        ])}
        totalItems={filteredData.length}
        itemLabel="Penawaran"
        onClose={() => setIsExportOpen(false)}
        onConfirmDownload={() => {
          downloadQuotationListPdf({
            quotations: filteredData,
            drafCount: metrics.draf,
            terkirimCount: metrics.terkirim,
            disetujuiCount: metrics.disetujui,
            statusFilter,
            searchQuery,
          });
          setIsExportOpen(false);
        }}
      />
    </div>
  );
}
