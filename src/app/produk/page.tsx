"use client";

import React, { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  initialProducts, subscribeProductStorage, getStoredProducts, getServerStoredProducts,
  getStoredUpdatedProducts, getServerStoredUpdatedProducts, getStoredDeletedProducts,
  getServerStoredDeletedProducts, saveImportedProductsToStorage, deleteProductFromStorage,
  getStoredBusinessMode, getServerStoredBusinessMode, saveBusinessModeToStorage,
} from "@/lib/data/mock-products";
import { ProductItem, BusinessMode } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { downloadProductReportPdf } from "@/lib/export-product-pdf";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { ProductTableCard, ProductMetrics } from "@/components/produk/ProductTableCard";
import { ProductImportCsvModal } from "@/components/produk/ProductImportCsvModal";

const ITEMS_PER_PAGE = 10;
let cachedProductClock = 0;

function subscribeToProductClock(callback: () => void) {
  cachedProductClock = Date.now();
  const interval = setInterval(() => { cachedProductClock = Date.now(); callback(); }, 60000);
  return () => clearInterval(interval);
}

function getProductClockSnapshot(): number {
  if (cachedProductClock === 0 && typeof window !== "undefined") cachedProductClock = Date.now();
  return cachedProductClock;
}

const getServerProductClockSnapshot = () => 0;

export default function ProdukPage() {
  const currentTime = useSyncExternalStore(subscribeToProductClock, getProductClockSnapshot, getServerProductClockSnapshot);
  const rawSavedProducts = useSyncExternalStore(subscribeProductStorage, getStoredProducts, getServerStoredProducts);
  const rawUpdatedProducts = useSyncExternalStore(subscribeProductStorage, getStoredUpdatedProducts, getServerStoredUpdatedProducts);
  const rawDeletedProducts = useSyncExternalStore(subscribeProductStorage, getStoredDeletedProducts, getServerStoredDeletedProducts);
  const businessMode = useSyncExternalStore(subscribeProductStorage, getStoredBusinessMode, getServerStoredBusinessMode);

  const savedProducts = useMemo<ProductItem[]>(() => { try { return JSON.parse(rawSavedProducts); } catch { return []; } }, [rawSavedProducts]);
  const updatedProducts = useMemo<Record<string, ProductItem>>(() => { try { return JSON.parse(rawUpdatedProducts); } catch { return {}; } }, [rawUpdatedProducts]);
  const deletedProductIds = useMemo<string[]>(() => { try { return JSON.parse(rawDeletedProducts); } catch { return []; } }, [rawDeletedProducts]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua kategori");
  const [selectedStatus, setSelectedStatus] = useState("Semua status");
  const [currentPage, setCurrentPage] = useState(1);

  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    title: "Item katalog tersimpan",
    description: "Item baru telah ditambahkan ke katalog penawaran dan tagihan.",
  });
  const [toastStatus, setToastStatus] = useState<ToastStatus>("hidden");

  const handleBusinessModeChange = useCallback((mode: BusinessMode) => {
    saveBusinessModeToStorage(mode);
    setCurrentPage(1);
  }, []);

  const showToast = useCallback((title: string, description: string) => {
    setToastConfig({ title, description });
    setToastStatus("visible");
    if (typeof window !== "undefined" && window.scrollY > 100) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const consumeFlashToast = () => {
      try {
        const flag = sessionStorage.getItem("araya_product_toast");
        if (!flag) return;
        const toastName = sessionStorage.getItem("araya_product_toast_name") || "Item katalog";
        sessionStorage.removeItem("araya_product_toast");
        sessionStorage.removeItem("araya_product_toast_name");
        if (flag === "updated") {
          showToast("Perubahan katalog tersimpan", `Data "${toastName}" berhasil diperbarui.`);
        } else {
          showToast("Item katalog berhasil ditambahkan", `Data "${toastName}" telah ditambahkan ke katalog penawaran dan tagihan.`);
        }
      } catch { /* ignore */ }
    };
    queueMicrotask(consumeFlashToast);
    window.addEventListener("araya-product-storage-update", consumeFlashToast);
    return () => window.removeEventListener("araya-product-storage-update", consumeFlashToast);
  }, [showToast]);

  const handleDismissToast = useCallback(() => {
    setToastStatus("exiting");
    setTimeout(() => setToastStatus("hidden"), 320);
  }, []);

  const products = useMemo(() => {
    const combined = savedProducts.length > 0
      ? [...savedProducts, ...initialProducts.filter((item) => !savedProducts.some((saved) => saved.id === item.id))]
      : initialProducts;
    const afterUpdates = combined.map((item) => (updatedProducts[item.id] ? { ...item, ...updatedProducts[item.id] } : item));
    return deletedProductIds.length > 0 ? afterUpdates.filter((item) => !deletedProductIds.includes(item.id)) : afterUpdates;
  }, [savedProducts, updatedProducts, deletedProductIds]);

  const recentSavedProducts = useMemo(() => {
    if (currentTime === 0) return [];
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return savedProducts.filter((item) => {
      if (deletedProductIds.includes(item.id)) return false;
      if (!item.createdAt) return true;
      const createdTime = new Date(item.createdAt).getTime();
      return !isNaN(createdTime) && currentTime - createdTime < ONE_DAY_MS;
    });
  }, [savedProducts, deletedProductIds, currentTime]);

  const metrics = useMemo<ProductMetrics>(() => {
    const physicalItems = products.filter((p) => p.category === "Produk");
    const totalWarehouseUnits = physicalItems.reduce((acc, p) => acc + (p.stock ?? 0), 0);
    const lowStockCount = physicalItems.filter((p) => (p.stock ?? 0) <= 5).length;

    return {
      totalCount: products.length,
      physicalCount: physicalItems.length,
      serviceCount: products.filter((p) => p.category === "Jasa").length,
      inactiveCount: products.filter((p) => p.status === "Nonaktif").length,
      recentTotalCount: recentSavedProducts.length,
      recentPhysicalCount: recentSavedProducts.filter((p) => p.category === "Produk").length,
      recentServiceCount: recentSavedProducts.filter((p) => p.category === "Jasa").length,
      totalWarehouseUnits,
      lowStockCount,
    };
  }, [products, recentSavedProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((item) => {
      if (businessMode === "Produk" && item.category !== "Produk") return false;
      if (businessMode === "Jasa" && item.category !== "Jasa") return false;

      const matchSearch = !query || item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      const matchCategory = businessMode !== "Semua" ? true : selectedCategory === "Semua kategori" || item.category === selectedCategory;
      const matchStatus = selectedStatus === "Semua status" || item.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, businessMode, searchTerm, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
  const currentData = filteredProducts.slice(startIndex, endIndex);

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const target = productToDelete;
    deleteProductFromStorage(target.id);
    setProductToDelete(null);
    showToast("Item berhasil dihapus", `Data "${target.name}" telah dihapus dari katalog.`);
  };

  const handleImportItems = (parsedItems: Omit<ProductItem, "id" | "createdAt">[]) => {
    const nowIso = new Date().toISOString();
    const baseTimestamp = Date.now();
    const newItems: ProductItem[] = parsedItems.map((item, idx) => ({
      ...item,
      id: `ITEM-${baseTimestamp}-${idx}`,
      createdAt: nowIso,
    }));
    saveImportedProductsToStorage(newItems);
    setIsImportModalOpen(false);
    showToast("Data katalog berhasil diimpor", `${newItems.length} item baru telah ditambahkan ke katalog.`);
  };

  const handleConfirmExportProductPdf = () => {
    downloadProductReportPdf({
      products: filteredProducts,
      totalCount: metrics.totalCount,
      activeCount: metrics.totalCount - metrics.inactiveCount,
      selectedCategory: businessMode === "Semua" ? selectedCategory : businessMode,
      selectedStatus,
      searchTerm,
    });
    setIsExportPreviewOpen(false);
    showToast("Laporan PDF berhasil diunduh", `${filteredProducts.length} item katalog telah diekspor ke dalam dokumen PDF.`);
  };

  const previewDateLabel = useMemo(() => {
    const refTime = currentTime > 0 ? new Date(currentTime) : new Date("2026-11-01T14:00:00+07:00");
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(refTime);
  }, [currentTime]);

  const pageTitle = businessMode === "Produk" ? "Katalog Produk" : businessMode === "Jasa" ? "Katalog Jasa & Layanan" : "Katalog Produk & Jasa";
  const pageSubtitle = businessMode === "Produk"
    ? "Kelola katalog produk fisik, kuantitas stok persediaan gudang, dan harga jual"
    : businessMode === "Jasa"
    ? "Kelola daftar paket layanan jasa profesional, tarif acuan, dan penawaran"
    : "Kelola katalog produk fisik dan layanan jasa untuk penawaran dan tagihan";

  return (
    <>
      <Breadcrumb separator="/" items={[{ label: "Katalog" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-16.5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-end min-h-13">
          {toastStatus !== "hidden" ? (
            <ToastNotification status={toastStatus} title={toastConfig.title} description={toastConfig.description} onDismiss={handleDismissToast} />
          ) : (
            <Link
              href={`/produk/tambah${businessMode !== "Semua" ? `?mode=${businessMode}` : ""}`}
              className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-all w-full sm:w-auto shrink-0 animate-fade-in"
            >
              <Plus className="w-4 h-4" />
              <span>{businessMode === "Produk" ? "Tambah produk" : businessMode === "Jasa" ? "Tambah layanan jasa" : "Tambah item katalog"}</span>
            </Link>
          )}
        </div>
      </div>

      <ProductTableCard
        metrics={metrics} businessMode={businessMode} searchTerm={searchTerm} selectedCategory={selectedCategory} selectedStatus={selectedStatus}
        currentData={currentData} filteredCount={filteredProducts.length} safeCurrentPage={safeCurrentPage}
        totalPages={totalPages} startIndex={startIndex} endIndex={endIndex}
        onBusinessModeChange={handleBusinessModeChange}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        onCategoryChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
        onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
        onPageChange={(page) => page >= 1 && page <= totalPages && setCurrentPage(page)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportPreviewOpen(true)}
        onRequestDelete={(item) => setProductToDelete(item)}
      />

      <ExportPdfPreviewModal
        open={isExportPreviewOpen}
        title="Pratinjau laporan PDF katalog"
        documentSubtitle="Laporan Katalog — Modul Penawaran & Tagihan Penjualan"
        printedAtLabel={previewDateLabel}
        filters={[
          { label: "Tipe Usaha", value: businessMode },
          { label: "Kategori", value: businessMode === "Semua" ? selectedCategory : businessMode },
          { label: "Status", value: selectedStatus },
          { label: "Cari", value: searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua" },
        ]}
        summaryCards={[
          { label: "Total Item Terdaftar", value: `${metrics.totalCount} Item katalog`, accent: "navy" },
          { label: "Item Katalog Aktif", value: `${metrics.totalCount - metrics.inactiveCount} Siap ditransaksikan`, accent: "teal" },
          { label: "Data Terekspor (Sesuai Filter)", value: `${filteredProducts.length} Item katalog`, accent: "navy", highlightValue: true },
        ]}
        columns={[
          { header: "No", className: "w-9 text-slate-500" },
          { header: "Nama & SKU", className: "font-bold text-slate-900" },
          { header: "Kategori / Stok", className: "text-slate-700 whitespace-nowrap" },
          { header: "Harga Acuan", align: "right", className: "font-bold text-slate-900 whitespace-nowrap" },
          { header: "Status", className: "text-slate-700 whitespace-nowrap" },
          { header: "Deskripsi", className: "text-slate-700" },
        ]}
        rows={filteredProducts.map((item, idx) => [
          idx + 1,
          <div key={item.id}>
            <div className="font-bold text-slate-900">{item.name}</div>
            <div className="text-[10px] font-mono text-slate-500 font-normal">{item.sku}</div>
          </div>,
          item.category === "Produk" ? `Produk (${item.stock ?? 0} ${item.unit || "Unit"})` : `Jasa (Per ${item.unit || "Paket"})`,
          formatRupiah(item.price), item.status, item.description,
        ])}
        emptyMessage="Tidak ada data item katalog yang sesuai dengan filter pencarian."
        totalItems={filteredProducts.length}
        itemLabel="item katalog"
        onClose={() => setIsExportPreviewOpen(false)}
        onConfirmDownload={handleConfirmExportProductPdf}
      />

      <ConfirmationModal
        open={Boolean(productToDelete)}
        title="Hapus item katalog?"
        subtitle="Konfirmasi penghapusan item dari katalog"
        description="Apakah Anda yakin ingin menghapus item ini? Item yang telah dihapus tidak akan tampil lagi pada pemilihan katalog di dokumen penawaran maupun invoice baru."
        confirmLabel="Ya, hapus"
        variant="danger"
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      >
        {productToDelete && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{productToDelete.name}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {productToDelete.sku} | {productToDelete.category} | {productToDelete.status}
                </div>
              </div>
              <div className="text-xs font-heading font-bold text-[#19376d] shrink-0">{formatRupiah(productToDelete.price)}</div>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">{productToDelete.description}</div>
          </>
        )}
      </ConfirmationModal>

      <ProductImportCsvModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportItems={handleImportItems} />
    </>
  );
}
