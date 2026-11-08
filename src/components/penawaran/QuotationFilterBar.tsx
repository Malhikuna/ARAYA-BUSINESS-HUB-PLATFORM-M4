"use client";

import React from "react";
import { Search, Download, SlidersHorizontal, ChevronDown } from "lucide-react";

export interface QuotationFilterBarProps {
  searchTerm: string;
  selectedStatus: string;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onOpenExportPreview: () => void;
}

/**
 * FilterBar untuk pencarian, filter status, dan tombol ekspor penawaran.
 */
export function QuotationFilterBar({
  searchTerm,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onOpenExportPreview,
}: QuotationFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nomor atau pelanggan"
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] transition-all"
        />
      </div>

      {/* Filter & Ekspor Actions */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Filter Status */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 pl-8 pr-8 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-xs font-semibold text-slate-700 outline-none cursor-pointer transition-colors appearance-none"
            aria-label="Filter status penawaran"
          >
            <option value="ALL">Semua status</option>
            <option value="PENDING_APPROVAL">Menunggu persetujuan</option>
            <option value="APPROVED">Disetujui</option>
          </select>
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Tombol Ekspor */}
        <button
          type="button"
          onClick={onOpenExportPreview}
          title="Pratinjau & ekspor daftar penawaran ke PDF"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor</span>
        </button>
      </div>
    </div>
  );
}

