"use client";

import React, { useState, useMemo, useEffect, useCallback, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  initialCustomers, getCustomerInitials, detectCityFromAddress, subscribeCustomerStorage,
  getStoredCustomers, getServerStoredCustomers, getStoredCustomerUpdates, getServerStoredCustomerUpdates,
  getStoredDeletedCustomers, getServerStoredDeletedCustomers, saveNewCustomerToStorage, deleteCustomerFromStorage,
  syncCustomersFromDatabase,
} from "@/lib/data/mock-customers";
import { Customer } from "@/types/customer";
import { downloadCustomerReportPdf } from "@/lib/export-customer-pdf";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { CustomerTableCard } from "@/components/pelanggan/CustomerTableCard";

const ITEMS_PER_PAGE = 10;
let cachedClock = 0;

function subscribeToClock(callback: () => void) {
  cachedClock = Date.now();
  const interval = setInterval(() => { cachedClock = Date.now(); callback(); }, 60000);
  return () => clearInterval(interval);
}
const getClockSnapshot = () => (cachedClock === 0 && typeof window !== "undefined" ? (cachedClock = Date.now()) : cachedClock);
const getServerClockSnapshot = () => 0;

function DaftarPelangganContent() {
  const searchParams = useSearchParams();
  const [statusParam, newNameParam, phoneParam, emailParam, addressParam] = [
    searchParams.get("status"), searchParams.get("name"), searchParams.get("phone"),
    searchParams.get("email"), searchParams.get("address"),
  ];
  const hasHandledUrlRef = React.useRef(false);

  const currentTime = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot);
  const rawSaved = useSyncExternalStore(subscribeCustomerStorage, getStoredCustomers, getServerStoredCustomers);
  const rawUpdates = useSyncExternalStore(subscribeCustomerStorage, getStoredCustomerUpdates, getServerStoredCustomerUpdates);
  const rawDeleted = useSyncExternalStore(subscribeCustomerStorage, getStoredDeletedCustomers, getServerStoredDeletedCustomers);

  const savedCustomers = useMemo<Customer[]>(() => { try { return JSON.parse(rawSaved); } catch { return []; } }, [rawSaved]);
  const updatedCustomers = useMemo<Record<string, Customer>>(() => { try { return JSON.parse(rawUpdates); } catch { return {}; } }, [rawUpdates]);
  const deletedCustomerIds = useMemo<string[]>(() => { try { return JSON.parse(rawDeleted); } catch { return []; } }, [rawDeleted]);

  const [toastConfig, setToastConfig] = useState({
    title: "Pelanggan tersimpan",
    description: "Data sudah tersedia untuk penawaran, invoice, dan order.",
  });
  const [toastStatus, setToastStatus] = useState<ToastStatus>("hidden");

  const showToast = useCallback((title: string, description: string) => {
    setToastConfig({ title, description });
    setToastStatus("visible");
    if (typeof window !== "undefined" && window.scrollY > 100) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    syncCustomersFromDatabase();
  }, []);

  useEffect(() => {
    const consumeFlashToast = () => {
      try {
        const flag = sessionStorage.getItem("araya_show_toast");
        if (!flag) return;
        const toastName = sessionStorage.getItem("araya_toast_name") || "Pelanggan";
        sessionStorage.removeItem("araya_show_toast");
        sessionStorage.removeItem("araya_toast_name");
        if (flag === "updated") {
          showToast("Perubahan pelanggan tersimpan", `Data "${toastName}" berhasil diperbarui.`);
        } else {
          showToast("Pelanggan tersimpan", `Data "${toastName}" sudah tersedia untuk penawaran, invoice, dan order.`);
        }
      } catch { /* ignore */ }
    };
    queueMicrotask(consumeFlashToast);
    window.addEventListener("araya-storage-update", consumeFlashToast);
    return () => window.removeEventListener("araya-storage-update", consumeFlashToast);
  }, [showToast]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Semua kota");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleDismiss = useCallback(() => {
    setToastStatus("exiting");
    setTimeout(() => setToastStatus("hidden"), 320);
  }, []);

  useEffect(() => {
    if (statusParam === "created" && !hasHandledUrlRef.current) {
      hasHandledUrlRef.current = true;
      if (newNameParam) {
        const addr = addressParam || "Jl. Asia Afrika No. 45, Bandung";
        saveNewCustomerToStorage({
          id: `CUST-${Date.now()}`,
          name: newNameParam,
          initials: getCustomerInitials(newNameParam, 2),
          avatarBg: "bg-blue-100 text-blue-700",
          phone: phoneParam || "0812 3456 7890",
          email: emailParam || "kontak@majubersama.co.id",
          address: addr,
          city: detectCityFromAddress(addr, "Bandung"),
          createdAt: new Date().toISOString(),
        });
      }
      window.history.replaceState(null, "", "/pelanggan");
    }
  }, [statusParam, newNameParam, phoneParam, emailParam, addressParam]);

  const customerList = useMemo(() => {
    const baseList = savedCustomers.length > 0
      ? [
          ...savedCustomers,
          ...initialCustomers.filter(
            (c) =>
              !savedCustomers.some(
                (s) =>
                  s.id === c.id ||
                  s.name.toLowerCase() === c.name.toLowerCase() ||
                  (s.email && c.email && s.email.toLowerCase() === c.email.toLowerCase())
              )
          ),
        ]
      : initialCustomers;
    const afterUpdates = Object.keys(updatedCustomers).length > 0
      ? baseList.map((item) => (updatedCustomers[item.id] ? { ...item, ...updatedCustomers[item.id] } : item))
      : baseList;
    return deletedCustomerIds.length > 0 ? afterUpdates.filter((item) => !deletedCustomerIds.includes(item.id)) : afterUpdates;
  }, [savedCustomers, updatedCustomers, deletedCustomerIds]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    customerList.forEach((c) => {
      const city = c.city || detectCityFromAddress(c.address || "", "");
      if (city && city.trim()) set.add(city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [customerList]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const termDigits = term.replace(/[\s+-]/g, "");

    return customerList.filter((item) => {
      const matchSearch = !term ||
        item.name.toLowerCase().includes(term) ||
        (item.phone && item.phone.replace(/[\s+-]/g, "").includes(termDigits)) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.address && item.address.toLowerCase().includes(term)) ||
        (item.city && item.city.toLowerCase().includes(term));

      const matchCity = selectedCity === "Semua kota" || item.city === selectedCity;
      return matchSearch && matchCity;
    });
  }, [customerList, searchTerm, selectedCity]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length);
  const currentData = filteredCustomers.slice(startIndex, endIndex);

  const recentNewCount = useMemo(() => {
    if (currentTime === 0) return 0;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return savedCustomers.filter((c) => {
      if (deletedCustomerIds.includes(c.id)) return false;
      if (!c.id.startsWith("CUST-")) return false;
      if (!c.createdAt) return true;
      const createdTime = new Date(c.createdAt).getTime();
      return !isNaN(createdTime) && currentTime - createdTime < ONE_DAY_MS;
    }).length;
  }, [savedCustomers, deletedCustomerIds, currentTime]);

  const totalCount = customerList.length;
  const newlyCreatedCount = savedCustomers.filter((c) => !deletedCustomerIds.includes(c.id) && c.id.startsWith("CUST-")).length;
  const newThisMonthCount = 3 + newlyCreatedCount;

  const handleConfirmExportPdf = () => {
    downloadCustomerReportPdf({ customers: filteredCustomers, totalRegistered: totalCount, activeCustomers: 15, selectedCity, searchTerm });
    setIsExportPreviewOpen(false);
    showToast("Laporan PDF berhasil diunduh", `${filteredCustomers.length} data pelanggan telah diekspor ke dalam dokumen PDF.`);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    const target = customerToDelete;
    deleteCustomerFromStorage(target.id);
    setCustomerToDelete(null);
    showToast("Pelanggan berhasil dihapus", `Data "${target.name}" telah dihapus dari daftar pelanggan.`);
  };

  const previewDateLabel = useMemo(() => {
    const refTime = currentTime > 0 ? new Date(currentTime) : new Date("2026-11-01T13:30:00+07:00");
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(refTime);
  }, [currentTime]);

  return (
    <>
      <ToastNotification status={toastStatus} title={toastConfig.title} description={toastConfig.description} onDismiss={handleDismiss} />
      <Breadcrumb separator="/" items={[{ label: "Pelanggan" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-16.5 relative">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight shrink-0">Daftar pelanggan</h1>
        <div className="w-full sm:w-auto flex items-center justify-end min-h-13">
          <Link href="/pelanggan/tambah" className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-all w-full sm:w-auto animate-fade-in">
            <Plus className="w-4 h-4" />
            <span>Tambah pelanggan</span>
          </Link>
        </div>
      </div>

      <CustomerTableCard
        totalCount={totalCount} recentNewCount={recentNewCount} newThisMonthCount={newThisMonthCount}
        searchTerm={searchTerm} selectedCity={selectedCity} availableCities={availableCities} currentData={currentData}
        filteredCount={filteredCustomers.length} safeCurrentPage={safeCurrentPage} totalPages={totalPages}
        startIndex={startIndex} endIndex={endIndex}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        onCityChange={(val) => { setSelectedCity(val); setCurrentPage(1); }}
        onPageChange={(page) => page >= 1 && page <= totalPages && setCurrentPage(page)}
        onOpenExportPreview={() => setIsExportPreviewOpen(true)}
        onRequestDelete={(cust) => setCustomerToDelete(cust)}
      />

      <ExportPdfPreviewModal
        open={isExportPreviewOpen}
        title="Pratinjau laporan PDF daftar pelanggan"
        documentSubtitle="Laporan Daftar Pelanggan — Modul Penawaran & Tagihan Penjualan"
        printedAtLabel={previewDateLabel}
        filters={[
          { label: "Filter Kota", value: selectedCity },
          { label: "Cari", value: searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua" },
        ]}
        summaryCards={[
          { label: "Total Pelanggan Terdaftar", value: `${totalCount} Pelanggan`, accent: "navy" },
          { label: "Pelanggan Aktif", value: "15 Transaksi berjalan", accent: "teal" },
          { label: "Data Terekspor (Sesuai Filter)", value: `${filteredCustomers.length} Data pelanggan`, accent: "navy", highlightValue: true },
        ]}
        columns={[
          { header: "No", className: "w-9 text-slate-500" },
          { header: "Nama Pelanggan", className: "font-bold text-slate-900" },
          { header: "Telepon", className: "font-mono text-slate-700 whitespace-nowrap" },
          { header: "Email", className: "text-slate-700 break-all" },
          { header: "Alamat Lengkap", className: "text-slate-700" },
        ]}
        rows={filteredCustomers.map((item, idx) => [idx + 1, item.name, item.phone, item.email, item.address])}
        emptyMessage="Tidak ada data pelanggan yang sesuai dengan filter pencarian."
        totalItems={filteredCustomers.length}
        itemLabel="pelanggan"
        onClose={() => setIsExportPreviewOpen(false)}
        onConfirmDownload={handleConfirmExportPdf}
      />

      <ConfirmationModal
        open={Boolean(customerToDelete)}
        title="Hapus data pelanggan?"
        subtitle="Konfirmasi penghapusan data dari daftar pelanggan"
        description="Apakah Anda yakin ingin menghapus pelanggan ini? Data yang telah dihapus tidak akan tampil lagi pada pemilihan pelanggan di dokumen penawaran baru."
        confirmLabel="Ya, hapus"
        variant="danger"
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
      >
        {customerToDelete && (
          <>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${customerToDelete.avatarBg}`}>
                {customerToDelete.initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{customerToDelete.name}</div>
                <div className="text-[11px] font-mono text-slate-500">{customerToDelete.id} | {customerToDelete.phone}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">{customerToDelete.address}</div>
          </>
        )}
      </ConfirmationModal>
    </>
  );
}

export default function DaftarPelangganPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Memuat data pelanggan...</div>}>
      <DaftarPelangganContent />
    </Suspense>
  );
}
