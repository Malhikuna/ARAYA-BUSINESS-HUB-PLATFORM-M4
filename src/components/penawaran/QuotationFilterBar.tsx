"use client";

import React from "react";
import { Search, X, Download } from "lucide-react";
import { QuotationFilterStatus } from "@/types/quotation";

export interface QuotationFilterBarProps {
  searchTerm: string;
  selectedStatus: QuotationFilterStatus;
  isCustomer?: boolean;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: QuotationFilterStatus) => void;
  onOpenExportPreview: () => void;
}

const TABS: { label: string; value: QuotationFilterStatus }[] = [
  { label: "Semua", value: "ALL" },
  { label: "Draf", value: "DRAFT" },
  { label: "Terkirim", value: "SENT" },
  { label: "Disetujui", value: "APPROVED" },
  { label: "Ditolak", value: "REJECTED" },
];

/**
 * FilterBar untuk pencarian, tab status (Semua, Draf, Terkirim, Disetujui), dan tombol ekspor.
 */
export function QuotationFilterBar({
  searchTerm,
  selectedStatus,
  isCustomer = false,
  onSearchChange,
  onStatusChange,
  onOpenExportPreview,
}: QuotationFilterBarProps) {
  const visibleTabs = isCustomer ? TABS.filter((tab) => tab.value !== "DRAFT") : TABS;
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs mb-5 sm:mb-6 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3">
      {/* 1. Kotak Pencarian */}
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
          aria-label="Cari penawaran berdasarkan nomor, permintaan, customer, atau jasa"
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] transition-all"
          suppressHydrationWarning
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Bersihkan pencarian penawaran"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Tab Filter Status & Tombol Ekspor */}
      <div className="flex flex-wrap items-center justify-between @3xl:justify-end gap-2.5 shrink-0">
        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#f0f4fa] rounded-xl overflow-x-auto max-w-full custom-scrollbar">
          {visibleTabs.map((tab) => {
            const isActive =
              selectedStatus === tab.value ||
              (tab.value === "SENT" && selectedStatus === "PENDING_APPROVAL");
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white text-[#19376d] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tombol Ekspor */}
        <button
          type="button"
          onClick={onOpenExportPreview}
          title="Pratinjau & ekspor daftar penawaran ke PDF"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer shrink-0"
          suppressHydrationWarning
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor</span>
        </button>
      </div>
    </div>
  );
}
