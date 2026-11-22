"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { PermintaanStatus } from "@/types/permintaan";

export type PermintaanTabFilter = "ALL" | PermintaanStatus;

export interface PermintaanFilterBarProps {
  activeTab: PermintaanTabFilter;
  newCount: number;
  offeredCount: number;
  searchTerm: string;
  onTabChange: (tab: PermintaanTabFilter) => void;
  onSearchChange: (term: string) => void;
}

/**
 * Filter Bar untuk Permintaan Jasa
 * Memuat kotak pencarian di sebelah kiri dan tombol tab status (Semua, Baru, Sudah ditawarkan) di sebelah kanan.
 */
export function PermintaanFilterBar({
  activeTab,
  newCount,
  offeredCount,
  searchTerm,
  onTabChange,
  onSearchChange,
}: PermintaanFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs mb-5 sm:mb-6 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3">
      {/* 1. Kotak Pencarian (Kiri) */}
      <div className="relative w-full @3xl:flex-1 @3xl:max-w-96 min-w-0">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onSearchChange("");
          }}
          placeholder="Cari nomor, permintaan, customer, atau jasa..."
          aria-label="Cari permintaan berdasarkan nomor, nama permintaan, customer, atau jasa"
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] transition-all"
          suppressHydrationWarning
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Bersihkan pencarian permintaan"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Tab Filter Status (Kanan) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#f0f4fa] rounded-xl overflow-x-auto max-w-full shrink-0 custom-scrollbar justify-start @3xl:justify-end self-start @3xl:self-auto">
        <button
          type="button"
          onClick={() => onTabChange("ALL")}
          className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-white text-[#19376d] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => onTabChange("Baru")}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Baru"
              ? "bg-white text-[#19376d] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Baru</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "Baru"
                ? "bg-[#d5f0f6] text-[#0f5368]"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {newCount > 99 ? "99+" : newCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("Sudah ditawarkan")}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Sudah ditawarkan"
              ? "bg-white text-[#19376d] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Sudah ditawarkan</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "Sudah ditawarkan"
                ? "bg-[#d5f0f6] text-[#0f5368]"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {offeredCount > 99 ? "99+" : offeredCount}
          </span>
        </button>
      </div>
    </div>
  );
}
