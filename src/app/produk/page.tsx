"use client";

import React, { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  initialProducts, subscribeProductStorage, getStoredProducts, getServerStoredProducts,
  getStoredUpdatedProducts, getServerStoredUpdatedProducts, getStoredDeletedProducts,
  getServerStoredDeletedProducts, saveImportedProductsToStorage, deleteProductFromStorage,
  getStoredBusinessMode, getServerStoredBusinessMode, saveBusinessModeToStorage,
  syncProductsFromDatabase,
} from "@/lib/data/mock-products";
import { ProductItem, BusinessMode } from "@/types/product";
import { downloadProductReportPdf } from "@/lib/export-product-pdf";
import { filterAndSortProducts, computeProductMetrics } from "@/lib/product-filter";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { ProductTableCard } from "@/components/produk/ProductTableCard";
import { ProductImportCsvModal } from "@/components/produk/ProductImportCsvModal";
import { ProductPageHeader } from "@/components/produk/ProductPageHeader";
import { ProductDeleteModal } from "@/components/produk/ProductDeleteModal";
import { ProductExportPdfModal } from "@/components/produk/ProductExportPdfModal";

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
  const [selectedStock, setSelectedStock] = useState("Semua stok");
  const [selectedUnit, setSelectedUnit] = useState("Semua satuan");
  const [selectedPrice, setSelectedPrice] = useState("Semua harga");
  const [currentPage, setCurrentPage] = useState(1);

  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    title: "Produk/jasa tersimpan",
    description: "Item baru telah ditambahkan ke katalog penawaran dan tagihan.",
  });
  const [toastStatus, setToastStatus] = useState<ToastStatus>("hidden");

  const handleBusinessModeChange = useCallback((mode: BusinessMode) => {
    saveBusinessModeToStorage(mode);
    setCurrentPage(1);
    setSelectedStock("Semua stok");
    setSelectedUnit("Semua satuan");
    setSelectedPrice("Semua harga");
  }, []);

  const showToast = useCallback((title: string, description: string) => {
    setToastConfig({ title, description });
    setToastStatus("visible");
    if (typeof window !== "undefined" && window.scrollY > 100) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    syncProductsFromDatabase();
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
          showToast("Produk/jasa tersimpan", `Data "${toastName}" telah ditambahkan ke katalog penawaran dan tagihan.`);
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
      ? [
          ...savedProducts,
          ...initialProducts.filter(
            (item) =>
              !savedProducts.some(
                (saved) =>
                  saved.id === item.id ||
                  saved.sku === item.sku ||
                  saved.name.toLowerCase() === item.name.toLowerCase()
              )
          ),
        ]
      : initialProducts;
    const afterUpdates = combined.map((item) => (updatedProducts[item.id] ? { ...item, ...updatedProducts[item.id] } : item));
    return deletedProductIds.length > 0 ? afterUpdates.filter((item) => !deletedProductIds.includes(item.id)) : afterUpdates;
  }, [savedProducts, updatedProducts, deletedProductIds]);

  const recentSavedProducts = useMemo(() => {
    if (currentTime === 0) return [];
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return savedProducts.filter((item) => {
      if (deletedProductIds.includes(item.id)) return false;
      if (!item.id.startsWith("ITEM-")) return false;
      if (!item.createdAt) return true;
      const createdTime = new Date(item.createdAt).getTime();
      return !isNaN(createdTime) && currentTime - createdTime < ONE_DAY_MS;
    });
  }, [savedProducts, deletedProductIds, currentTime]);

  const metrics = useMemo(() => computeProductMetrics(products, recentSavedProducts), [products, recentSavedProducts]);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, {
      businessMode,
      searchTerm,
      selectedCategory,
      selectedStatus,
      selectedStock,
      selectedUnit,
      selectedPrice,
    });
  }, [products, businessMode, searchTerm, selectedCategory, selectedStatus, selectedStock, selectedUnit, selectedPrice]);

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

  return (
    <>
      <Breadcrumb items={[{ label: "Katalog" }]} />
      <ToastNotification status={toastStatus} title={toastConfig.title} description={toastConfig.description} onDismiss={handleDismissToast} />

      <ProductPageHeader businessMode={businessMode} />

      <ProductTableCard
        metrics={metrics}
        businessMode={businessMode}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        selectedStock={selectedStock}
        selectedUnit={selectedUnit}
        selectedPrice={selectedPrice}
        currentData={currentData}
        filteredCount={filteredProducts.length}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        onBusinessModeChange={handleBusinessModeChange}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        onCategoryChange={(val) => { setSelectedCategory(val); setCurrentPage(1); setSelectedStock("Semua stok"); setSelectedUnit("Semua satuan"); }}
        onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
        onStockChange={(val) => { setSelectedStock(val); setCurrentPage(1); }}
        onUnitChange={(val) => { setSelectedUnit(val); setCurrentPage(1); }}
        onPriceChange={(val) => { setSelectedPrice(val); setCurrentPage(1); }}
        onPageChange={(page) => page >= 1 && page <= totalPages && setCurrentPage(page)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportPreviewOpen(true)}
        onRequestDelete={(item) => setProductToDelete(item)}
      />

      <ProductExportPdfModal
        open={isExportPreviewOpen}
        onClose={() => setIsExportPreviewOpen(false)}
        onConfirmDownload={handleConfirmExportProductPdf}
        filteredProducts={filteredProducts}
        metrics={metrics}
        businessMode={businessMode}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        searchTerm={searchTerm}
        previewDateLabel={previewDateLabel}
      />

      <ProductDeleteModal
        product={productToDelete}
        onCancel={() => setProductToDelete(null)}
        onConfirm={handleConfirmDeleteProduct}
      />

      <ProductImportCsvModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportItems={handleImportItems} />
    </>
  );
}
