"use client";

import React from "react";
import { Search, X, Upload, Download } from "lucide-react";
import { ProductItem, BusinessMode } from "@/types/product";
import { Pagination } from "@/components/common/Pagination";
import { FilterSelect } from "@/components/common/FilterSelect";
import { ProductMetricCards, ProductMetrics } from "@/components/produk/ProductMetricCards";
import { ProductTableRow } from "@/components/produk/ProductTableRow";
import { useDevRole } from "@/lib/auth/dev-role";

export type { ProductMetrics };

export interface ProductTableCardProps {
  metrics: ProductMetrics;
  businessMode: BusinessMode;
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
  selectedStock: string;
  selectedUnit: string;
  selectedPrice: string;
  currentData: ProductItem[];
  filteredCount: number;
  safeCurrentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onBusinessModeChange: (mode: BusinessMode) => void;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onStockChange: (val: string) => void;
  onUnitChange: (val: string) => void;
  onPriceChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onRequestDelete: (item: ProductItem) => void;
}

export function ProductTableCard({
  metrics,
  businessMode,
  searchTerm,
  selectedCategory,
  selectedStatus,
  selectedStock,
  selectedPrice,
  currentData,
  filteredCount,
  safeCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  onBusinessModeChange,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onStockChange,
  onPriceChange,
  onPageChange,
  onOpenImportModal,
  onOpenExportModal,
  onRequestDelete,
}: ProductTableCardProps) {
  const { isDev, activeRole } = useDevRole();
  const isProductOnly = businessMode === "Produk";
  const isServiceOnly = businessMode === "Jasa";
  const isServiceCategory = isServiceOnly || (businessMode === "Semua" && selectedCategory === "Jasa");
  // Threshold 1-baris penuh (Search + Dropdown + Impor/Ekspor) menyesuaikan jumlah dropdown
  const singleRowClass = isServiceCategory
    ? "@3xl:flex-row @3xl:items-center"
    : businessMode === "Semua"
    ? "@5xl:flex-row @5xl:items-center"
    : "@4xl:flex-row @4xl:items-center";
  const actionsInlineClass = isServiceCategory
    ? "@3xl:pt-0 @3xl:border-t-0"
    : businessMode === "Semua"
    ? "@5xl:pt-0 @5xl:border-t-0"
    : "@4xl:pt-0 @4xl:border-t-0";

  return (
    <>
      {/* 4 Summary Metric Cards */}
      <ProductMetricCards metrics={metrics} businessMode={businessMode} />

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col gap-3.5 mb-5">
        {/* Business Mode Segmented Switcher */}
        {(!isDev || activeRole === "ADMIN") && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Tipe Usaha Terdaftar:</span>
              <span className="text-[11px] text-slate-500">Pilih model operasional usaha</span>
            </div>

            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {(["Semua", "Produk", "Jasa"] as BusinessMode[]).map((mode) => {
                const isSelected = businessMode === mode;
                const label = mode === "Semua" ? "Semua Katalog" : mode === "Produk" ? "Produk (Barang)" : "Jasa (Layanan)";
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onBusinessModeChange(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#19376d] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search, Filter, & Actions — Adaptif terhadap lebar konten (@container), aman saat sidebar dibuka/ditutup di Tablet */}
        <div className={`bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col ${singleRowClass} justify-between gap-2.5`}>
          <div className={`flex flex-col ${businessMode === "Semua" ? "@4xl:flex-row @4xl:items-center" : "@2xl:flex-row @2xl:items-center"} justify-between gap-2.5 flex-1 min-w-0`}>
            {/* Kotak Pencarian (Mengisi lebar proporsional hingga max-w-96 tanpa pernah mendorong dropdown keluar card) */}
            <div className={`relative w-full ${businessMode === "Semua" ? "@4xl:flex-1 @4xl:max-w-96" : "@2xl:flex-1 @2xl:max-w-96"} min-w-0`}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search aria-hidden="true" className="w-4 h-4" />
              </div>
              <input
                type="text"
                aria-label="Cari item katalog"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onSearchChange("");
                }}
                placeholder={isProductOnly ? "Cari produk barang..." : isServiceOnly ? "Cari layanan jasa..." : "Cari item katalog..."}
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] transition-all"
                suppressHydrationWarning
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian katalog"
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  suppressHydrationWarning
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filter (Grid 2 kolom di area sempit HP/Tablet-sidebar-buka, rata kanan di >= @2xl) */}
            <div className="grid grid-cols-2 @2xl:flex @2xl:flex-wrap @2xl:items-center @2xl:justify-end gap-2 shrink-0">
              {businessMode === "Semua" && (
                <FilterSelect
                  ariaLabel="Filter kategori item katalog"
                  value={selectedCategory}
                  onChange={onCategoryChange}
                  options={["Semua kategori", "Produk", "Jasa"]}
                  variant="soft"
                />
              )}

              {/* Dropdown Ketersediaan Stok (Produk/Semua) */}
              {!isServiceCategory && (
                <FilterSelect
                  ariaLabel="Filter ketersediaan stok produk"
                  value={selectedStock}
                  onChange={onStockChange}
                  options={["Semua stok", "Tersedia (≥ 10)", "Stok menipis (≤ 5)", "Stok habis (0)"]}
                  variant="soft"
                />
              )}

              {/* Dropdown Rentang & Urutan Harga */}
              <FilterSelect
                ariaLabel="Filter dan urutan harga item katalog"
                value={selectedPrice}
                onChange={onPriceChange}
                options={[
                  "Semua harga",
                  "Di bawah Rp 1 Jt",
                  "Rp 1 Jt - Rp 5 Jt",
                  "Di atas Rp 5 Jt",
                  "Harga: Terendah",
                  "Harga: Tertinggi",
                ]}
                variant="soft"
              />

              {/* Dropdown Status (span 2 kolom saat grid 2 kolom dengan total 3 dropdown agar rata) */}
              <FilterSelect
                ariaLabel="Filter status item katalog"
                value={selectedStatus}
                onChange={onStatusChange}
                options={["Semua status", "Aktif", "Nonaktif"]}
                className={!isServiceCategory && businessMode !== "Semua" ? "col-span-2 @2xl:col-span-1" : ""}
                variant="soft"
              />
            </div>
          </div>

          {/* Tombol Impor & Ekspor */}
          <div className={`grid grid-cols-2 @md:flex @md:items-center @md:justify-end gap-2 pt-2.5 border-t border-slate-100 ${actionsInlineClass} shrink-0`}>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              suppressHydrationWarning
            >
              <Upload aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
              <span>Impor data</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              aria-label="Ekspor data katalog ke PDF"
              title="Pratinjau & ekspor katalog ke PDF"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              suppressHydrationWarning
            >
              <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-195 lg:min-w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
                <th scope="col" className={`${isProductOnly ? "w-[28%]" : isServiceOnly ? "w-[28%]" : "w-[24%]"} px-3 sm:px-4 py-3.5`}>Nama</th>
                {!isProductOnly && !isServiceOnly && <th scope="col" className="w-[13%] px-3 sm:px-4 py-3.5">Kategori</th>}
                {!isServiceOnly && <th scope="col" className={`${isProductOnly ? "w-[14%]" : "w-[13%]"} px-3 sm:px-4 py-3.5 text-center`}>Stok</th>}
                {isServiceOnly && <th scope="col" className="w-[14%] px-3 sm:px-4 py-3.5">Satuan</th>}
                <th scope="col" className={`${isProductOnly ? "w-[20%]" : isServiceOnly ? "w-[20%]" : "w-[18%]"} px-3 sm:px-4 py-3.5 text-right`}>Harga</th>
                <th scope="col" className={`${isProductOnly ? "w-[24%]" : isServiceOnly ? "w-[24%]" : "w-[20%]"} px-3 sm:px-4 py-3.5`}>Deskripsi</th>
                <th scope="col" className={`${isProductOnly ? "w-[14%]" : isServiceOnly ? "w-[14%]" : "w-[12%]"} px-3 sm:px-4 py-3.5`}>Status</th>
                <th scope="col" className="w-28 px-2 sm:px-3 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <ProductTableRow
                    key={item.id}
                    item={item}
                    isProductOnly={isProductOnly}
                    isServiceOnly={isServiceOnly}
                    onRequestDelete={onRequestDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={isServiceOnly || isProductOnly ? 6 : 7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada data item katalog yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          startIndex={startIndex}
          endIndex={endIndex}
          itemLabel="item katalog"
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}
