"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Archive, Package, UserCog, PauseCircle, Upload, Download, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { ProductItem } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { Pagination } from "@/components/common/Pagination";

export interface ProductMetrics {
  totalCount: number;
  physicalCount: number;
  serviceCount: number;
  inactiveCount: number;
  recentTotalCount: number;
  recentPhysicalCount: number;
  recentServiceCount: number;
}

export interface ProductTableCardProps {
  metrics: ProductMetrics;
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
  currentData: ProductItem[];
  filteredCount: number;
  safeCurrentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
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
  searchTerm,
  selectedCategory,
  selectedStatus,
  currentData,
  filteredCount,
  safeCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPageChange,
  onOpenImportModal,
  onOpenExportModal,
  onRequestDelete,
}: ProductTableCardProps) {
  const router = useRouter();

  return (
    <>
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total produk &amp; jasa</span>
            <Archive aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.totalCount}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Item terdaftar</span>
            {metrics.recentTotalCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{metrics.recentTotalCount} baru
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Produk fisik</span>
            <Package aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.physicalCount}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Stok tersedia</span>
            {metrics.recentPhysicalCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{metrics.recentPhysicalCount} baru
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Layanan jasa</span>
            <UserCog aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.serviceCount}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Paket aktif</span>
            {metrics.recentServiceCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{metrics.recentServiceCount} baru
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total item nonaktif</span>
            <PauseCircle aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.inactiveCount}</div>
          <div className="text-xs text-slate-500">Perlu ditinjau</div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search aria-hidden="true" className="w-4 h-4" />
            </div>
            <input
              type="text"
              aria-label="Cari produk atau jasa"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari produk/jasa..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] focus:border-[#19376d] transition-all"
            />
          </div>

          <div className="relative">
            <select
              aria-label="Filter kategori produk atau jasa"
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

          <div className="relative">
            <select
              aria-label="Filter status produk atau jasa"
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
            aria-label="Ekspor data produk/jasa ke PDF"
            title="Pratinjau & ekspor katalog produk/jasa ke PDF"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Product / Service Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
                <th scope="col" className="px-6 py-3.5">Nama</th>
                <th scope="col" className="px-6 py-3.5">Kategori</th>
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
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Lihat detail produk atau jasa ${item.name}`}
                      title="Klik baris untuk melihat detail produk/jasa"
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
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">{item.category}</td>
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
                            aria-label={`Ubah produk atau jasa ${item.name}`}
                            title="Ubah produk/jasa"
                            className="p-1.5 rounded-lg text-[#19376d] hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <span aria-hidden="true" className="text-slate-300 select-none text-xs">|</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRequestDelete(item); }}
                            aria-label={`Hapus produk atau jasa ${item.name}`}
                            title="Hapus produk/jasa"
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada data produk atau jasa yang sesuai dengan filter pencarian.
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
          itemLabel="produk/jasa"
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}

