"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Upload, Download, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { ProductItem, BusinessMode } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { Pagination } from "@/components/common/Pagination";
import { ProductMetricCards, ProductMetrics } from "@/components/produk/ProductMetricCards";

export type { ProductMetrics };

export interface ProductTableCardProps {
  metrics: ProductMetrics;
  businessMode: BusinessMode;
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
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
  onPageChange,
  onOpenImportModal,
  onOpenExportModal,
  onRequestDelete,
}: ProductTableCardProps) {
  const router = useRouter();

  const isProductOnly = businessMode === "Produk";
  const isServiceOnly = businessMode === "Jasa";

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
              const label = mode === "Semua" ? "Semua Katalog" : mode === "Produk" ? "Khusus Produk (Barang)" : "Khusus Jasa (Layanan)";
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search aria-hidden="true" className="w-4 h-4" />
              </div>
              <input
                type="text"
                aria-label="Cari item katalog"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isProductOnly ? "Cari produk barang..." : isServiceOnly ? "Cari layanan jasa..." : "Cari item katalog..."}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] focus:border-[#19376d] transition-all"
              />
            </div>

            {businessMode === "Semua" && (
              <div className="relative">
                <select
                  aria-label="Filter kategori item katalog"
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full sm:w-auto h-10 pl-3.5 pr-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer transition-colors appearance-none"
                >
                  <option value="Semua kategori">Semua kategori</option>
                  <option value="Produk">Produk</option>
                  <option value="Jasa">Jasa</option>
                </select>
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <div className="relative">
              <select
                aria-label="Filter status item katalog"
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full sm:w-auto h-10 pl-3.5 pr-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer transition-colors appearance-none"
              >
                <option value="Semua status">Semua status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Upload aria-hidden="true" className="w-3.5 h-3.5 text-slate-600" />
              <span>Impor data</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              aria-label="Ekspor data katalog ke PDF"
              title="Pratinjau & ekspor katalog ke PDF"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
                <th scope="col" className="px-6 py-3.5">Nama</th>
                {!isProductOnly && !isServiceOnly && <th scope="col" className="px-6 py-3.5">Kategori</th>}
                {!isServiceOnly && <th scope="col" className="px-6 py-3.5 text-center">Stok</th>}
                {isServiceOnly && <th scope="col" className="px-6 py-3.5">Satuan</th>}
                <th scope="col" className="px-6 py-3.5 text-right">Harga</th>
                <th scope="col" className="px-6 py-3.5">Deskripsi</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length > 0 ? (
                currentData.map((item) => {
                  const isActive = item.status === "Aktif";
                  const isItemProduct = item.category === "Produk";
                  const stockCount = item.stock ?? 0;
                  const isLowStock = isItemProduct && stockCount <= 5;

                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Lihat detail item ${item.name}`}
                      title="Klik baris untuk melihat detail item katalog"
                      onClick={() => router.push(`/produk/lihat/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/produk/lihat/${item.id}`);
                        }
                      }}
                      className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-[#19376d] transition-colors text-xs sm:text-sm">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.sku}</div>
                      </td>

                      {!isProductOnly && !isServiceOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">{item.category}</td>
                      )}

                      {!isServiceOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isItemProduct ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              stockCount === 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : isLowStock
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700"
                            }`}>
                              <span>{stockCount} {item.unit || "Unit"}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 select-none text-[11px]">— (Layanan)</span>
                          )}
                        </td>
                      )}

                      {isServiceOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                            Per {item.unit || "Paket"}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">{formatRupiah(item.price)}</td>
                      <td className="px-6 py-4 text-slate-600 leading-relaxed max-w-md">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/produk/ubah/${item.id}`}
                            aria-label={`Ubah item ${item.name}`}
                            title="Ubah item katalog"
                            className="p-1.5 rounded-lg text-[#19376d] hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <span aria-hidden="true" className="text-slate-300 select-none text-xs">|</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRequestDelete(item); }}
                            aria-label={`Hapus item ${item.name}`}
                            title="Hapus item katalog"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
