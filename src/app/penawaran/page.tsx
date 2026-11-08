"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { QuotationMetricCards } from "@/components/penawaran/QuotationMetricCards";
import { QuotationFilterBar } from "@/components/penawaran/QuotationFilterBar";
import { QuotationTable } from "@/components/penawaran/QuotationTable";
import { formatRupiah } from "@/lib/format";
import {
  Quotation,
  QuotationFilterStatus,
} from "@/types/quotation";
import {
  getStoredQuotations,
  fetchQuotationsListFromDatabase,
  subscribeQuotationStorage,
  formatTanggalIndo,
} from "@/lib/data/mock-quotations";

const ITEMS_PER_PAGE = 5;

/**
 * Halaman utama Daftar Penawaran.
 * Menampilkan ringkasan metrik, filter pencarian & status, tabel data, serta fitur ekspor PDF.
 */
export default function PenawaranPage() {
  const [quotations, setQuotations] = useState<Quotation[]>(() => getStoredQuotations());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationFilterStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewDateLabel] = useState<string>(() =>
    new Date().toLocaleDateString("id-ID", { dateStyle: "long" })
  );
  const [toastState, setToastState] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>(() => {
    if (typeof window === "undefined") return { status: "hidden", title: "", description: "" };
    try {
      const toastType = sessionStorage.getItem("araya_show_quotation_toast");
      if (toastType === "created") {
        sessionStorage.removeItem("araya_show_quotation_toast");
        return { status: "visible", title: "Penawaran berhasil dibuat", description: "Menunggu persetujuan." };
      }
      if (toastType === "approved") {
        sessionStorage.removeItem("araya_show_quotation_toast");
        return { status: "visible", title: "Penawaran disetujui", description: "Invoice sekarang dapat dibuat." };
      }
    } catch {
      // ignore
    }
    return { status: "hidden", title: "", description: "" };
  });

  useEffect(() => {
    // Ambil data resmi dari database PostgreSQL
    fetchQuotationsListFromDatabase().then((dbList) => {
      if (dbList.length > 0) {
        setQuotations(dbList);
      }
    });

    const unsubscribe = subscribeQuotationStorage(() => {
      setQuotations(getStoredQuotations());
    });

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const total = quotations.length;
    const approved = quotations.filter((q) => q.status === "APPROVED").length;
    const pending = quotations.filter((q) => q.status === "PENDING_APPROVAL" || q.status === "DRAFT").length;
    return { total, approved, pending };
  }, [quotations]);

  const filteredData = useMemo(() => {
    return quotations.filter((item) => {
      const matchesSearch =
        item.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && item.status === "APPROVED") ||
        (statusFilter === "PENDING_APPROVAL" && (item.status === "PENDING_APPROVAL" || item.status === "DRAFT"));

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar penawaran
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola estimasi harga, penawaran resmi, dan persetujuan klien.
          </p>
        </div>

        <Link
          href="/penawaran/tambah"
          prefetch={false}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#19376d] hover:bg-[#142c57] shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah penawaran</span>
        </Link>
      </div>

      {/* Kartu Metrik */}
      <QuotationMetricCards
        totalCount={metrics.total}
        approvedCount={metrics.approved}
        pendingCount={metrics.pending}
      />

      {/* Filter Pencarian, Status & Ekspor */}
      <QuotationFilterBar
        searchTerm={searchQuery}
        selectedStatus={statusFilter}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        onStatusChange={(val) => {
          setStatusFilter(val as QuotationFilterStatus);
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
        onPageChange={setCurrentPage}
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
                : statusFilter === "PENDING_APPROVAL"
                ? "Menunggu persetujuan"
                : "Semua status",
          },
          { label: "Cari", value: searchQuery.trim() ? `"${searchQuery.trim()}"` : "Semua" },
        ]}
        summaryCards={[
          { label: "Total Penawaran", value: `${metrics.total} Penawaran`, accent: "navy" },
          { label: "Disetujui", value: `${metrics.approved} Disetujui`, accent: "teal" },
          { label: "Menunggu", value: `${metrics.pending} Menunggu`, accent: "navy", highlightValue: true },
        ]}
        columns={[
          { header: "Nomor" },
          { header: "Pelanggan" },
          { header: "Tanggal" },
          { header: "Total", align: "right" },
          { header: "Status" },
        ]}
        rows={filteredData.map((d) => [
          d.quotation_number,
          d.customer_name,
          formatTanggalIndo(d.quotation_date),
          formatRupiah(d.total_amount),
          d.status === "APPROVED" ? "Disetujui" : "Menunggu persetujuan",
        ])}
        totalItems={filteredData.length}
        itemLabel="Penawaran"
        onClose={() => setIsExportOpen(false)}
        onConfirmDownload={() => setIsExportOpen(false)}
      />
    </div>
  );
}
