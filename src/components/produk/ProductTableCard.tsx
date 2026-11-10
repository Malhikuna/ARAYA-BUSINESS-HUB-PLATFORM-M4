"use client";

import React, { useMemo } from "react";
import { Search, Upload, Download } from "lucide-react";
import { ProductItem, BusinessMode } from "@/types/product";
import { Pagination } from "@/components/common/Pagination";
import { FilterSelect } from "@/components/common/FilterSelect";
import { ProductMetricCards, ProductMetrics } from "@/components/produk/ProductMetricCards";
import { ProductTableRow } from "@/components/produk/ProductTableRow";

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
  selectedUnit,
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
  onUnitChange,
  onPriceChange,
  onPageChange,
  onOpenImportModal,
  onOpenExportModal,
  onRequestDelete,
}: ProductTableCardProps) {
  const isProductOnly = businessMode === "Produk";
  const isServiceOnly = businessMode === "Jasa";
  const isServiceCategory = isServiceOnly || (businessMode === "Semua" && selectedCategory === "Jasa");

  const serviceUnitOptions = useMemo(() => {
    const list = metrics.serviceUnits && metrics.serviceUnits.length > 0
      ? metrics.serviceUnits
      : ["Jam", "Sesi", "Bulan", "Proyek", "Paket"];
    return ["Semua satuan", ...list.map((u) => `Per ${u}`)];
  }, [metrics.serviceUnits]);

  return (
    <>
      {/* 4 Summary Metric Cards */}
      <ProductMetricCards metrics={metrics} businessMode={businessMode} />

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col gap-3.5 mb-5">
        {/* Business Mode Segmented Switcher */}
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

        {/* Search, Filter, & Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1 min-w-0">
            <div className="relative w-full sm:w-44 lg:w-48 xl:w-52 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search aria-hidden="true" className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                aria-label="Cari item katalog"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isProductOnly ? "Cari produk barang..." : isServiceOnly ? "Cari layanan jasa..." : "Cari item katalog..."}
                className="w-full h-9.5 pl-8.5 pr-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] focus:border-[#19376d] transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {businessMode === "Semua" && (
                <FilterSelect
                  ariaLabel="Filter kategori item katalog"
                  value={selectedCategory}
                  onChange={onCategoryChange}
                  options={["Semua kategori", "Produk", "Jasa"]}
                />
              )}

              {/* Dropdown Ketersediaan Stok (Produk/Semua) atau Satuan Penagihan (Jasa) */}
              {isServiceCategory ? (
                <FilterSelect
                  ariaLabel="Filter satuan penagihan layanan jasa"
                  value={selectedUnit}
                  onChange={onUnitChange}
                  options={serviceUnitOptions}
                />
              ) : (
                <FilterSelect
                  ariaLabel="Filter ketersediaan stok produk"
                  value={selectedStock}
                  onChange={onStockChange}
                  options={["Semua stok", "Tersedia (≥ 10)", "Stok menipis (≤ 5)", "Stok habis (0)"]}
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
              />

              {/* Dropdown Status */}
              <FilterSelect
                ariaLabel="Filter status item katalog"
                value={selectedStatus}
                onChange={onStatusChange}
                options={["Semua status", "Aktif", "Nonaktif"]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end xl:self-auto shrink-0">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Upload aria-hidden="true" className="w-3.5 h-3.5 text-slate-600" />
              <span>Impor data</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              aria-label="Ekspor data katalog ke PDF"
              title="Pratinjau & ekspor katalog ke PDF"
              className="inline-flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
                <th scope="col" className={`${isProductOnly ? "w-[28%]" : isServiceOnly ? "w-[30%]" : "w-[24%]"} px-3 sm:px-4 py-3.5`}>Nama</th>
                {!isProductOnly && !isServiceOnly && <th scope="col" className="w-[12%] px-3 sm:px-4 py-3.5">Kategori</th>}
                {!isServiceOnly && <th scope="col" className={`${isProductOnly ? "w-[14%]" : "w-[12%]"} px-3 sm:px-4 py-3.5 text-center`}>Stok</th>}
                {isServiceOnly && <th scope="col" className="w-[14%] px-3 sm:px-4 py-3.5">Satuan</th>}
                <th scope="col" className={`${isProductOnly ? "w-[18%]" : isServiceOnly ? "w-[18%]" : "w-[16%]"} px-3 sm:px-4 py-3.5 text-right`}>Harga</th>
                <th scope="col" className={`${isProductOnly ? "w-[22%]" : isServiceOnly ? "w-[20%]" : "w-[18%]"} px-3 sm:px-4 py-3.5`}>Deskripsi</th>
                <th scope="col" className="w-[10%] px-3 sm:px-4 py-3.5">Status</th>
                <th scope="col" className="w-[8%] px-3 sm:px-4 py-3.5 text-right">Tindakan</th>
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
