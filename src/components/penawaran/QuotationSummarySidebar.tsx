"use client";

import React from "react";
import { GitBranch, MessageCircle, Info } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export interface QuotationSummarySidebarProps {
  quotationNumber?: string;
  customerName?: string;
  itemsCount: number;
  totalAmount: number;
}

/**
 * Sidebar Tahapan Penawaran dan Rangkuman Dokumen pada form Buat Penawaran.
 * Sesuai desain Figma M4-US2 (Image 1 & 2).
 */
export function QuotationSummarySidebar({
  quotationNumber = "-",
  customerName = "",
  itemsCount,
  totalAmount,
}: QuotationSummarySidebarProps) {
  return (
    <div className="space-y-6">
      {/* 1. Card Tahapan Penawaran */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#19376d]" />
            <h2 className="text-sm font-bold text-slate-900">Tahapan penawaran</h2>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#19376d]" />
        </div>

        <div className="relative space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {/* Step 1: Draf */}
          <div className="relative flex items-start gap-3">
            <span className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#19376d] text-white ring-4 ring-white shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-900">Draf</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef4ff] text-[#19376d] shrink-0">
                  Sedang dibuat
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Susun rincian jasa dan harga penawaran
              </p>
            </div>
          </div>

          {/* Step 2: Kirim ke WhatsApp */}
          <div className="relative flex items-start gap-3">
            <span className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-500 ring-4 ring-white shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-900">Kirim ke WhatsApp</span>
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Kirim dokumen resmi penawaran langsung ke kontak WhatsApp customer
              </p>
            </div>
          </div>

          {/* Step 3: Disetujui Customer */}
          <div className="relative flex items-start gap-3">
            <span className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-500 ring-4 ring-white shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 block">Disetujui customer</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Customer meninjau dan memberikan persetujuan
              </p>
            </div>
          </div>

          {/* Step 4: Invoice */}
          <div className="relative flex items-start gap-3">
            <span className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-500 ring-4 ring-white shrink-0 mt-0.5">
              4
            </span>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 block">Invoice</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Terbitkan tagihan penjualan setelah disepakati
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card Rangkuman Dokumen */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Rangkuman dokumen</h2>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {quotationNumber}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Penerima</span>
            <span className="font-bold text-slate-900">{customerName || "Belum dipilih"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Jumlah jasa</span>
            <span className="font-semibold text-slate-800">{itemsCount} item layanan</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 shrink-0">Total penawaran</span>
            <span
              className={`font-heading font-bold text-[#19376d] text-right whitespace-nowrap tabular-nums shrink-0 ${
                totalAmount >= 1_000_000_000_000
                  ? "text-xs"
                  : totalAmount >= 1_000_000_000
                  ? "text-xs sm:text-sm"
                  : totalAmount >= 100_000_000
                  ? "text-sm"
                  : "text-sm sm:text-base"
              }`}
              title={formatRupiah(totalAmount)}
            >
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        <div className="bg-[#f0f5fa] border border-[#d8e4f0] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-[#19376d] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-600">
            Dokumen ini belum berstatus mengikat sebelum disetujui customer.
          </p>
        </div>
      </div>
    </div>
  );
}
