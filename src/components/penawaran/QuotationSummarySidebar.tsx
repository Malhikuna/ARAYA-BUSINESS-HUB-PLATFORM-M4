"use client";

import React from "react";
import { Info, Clock } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export interface QuotationSummarySidebarProps {
  itemsCount: number;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  statusLabel?: string;
  activeStep?: 1 | 2 | 3;
}

/**
 * Sidebar ringkasan kalkulasi dan tahapan alur penawaran harga.
 */
export function QuotationSummarySidebar({
  itemsCount,
  subtotal,
  taxAmount = 0,
  totalAmount,
  statusLabel = "Draf",
  activeStep = 1,
}: QuotationSummarySidebarProps) {
  return (
    <div className="space-y-6">
      {/* 1. Card Ringkasan Penawaran */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Ringkasan penawaran</h2>
          <Info className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status dokumen</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Jumlah entri</span>
            <span className="font-semibold text-slate-800">{itemsCount} item</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Subtotal bruto</span>
            <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Pajak (PPN 0%)</span>
            <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-slate-700">Estimasi akhir</span>
          <span className="text-xl font-heading font-bold text-[#19376d]">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Kotak Masa Berlaku Penawaran */}
        <div className="bg-[#f0f4fa] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <Clock className="w-4 h-4 text-[#19376d] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block text-[11px]">Masa berlaku penawaran</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Standar validitas proposal adalah 14 hari kalender terhitung sejak penerbitan.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Card Tahapan Penawaran */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Tahapan penawaran
        </h2>

        <div className="space-y-4">
          {/* Step 1: Pembuatan Draf */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 1
                  ? "bg-[#19376d] text-white"
                  : "bg-emerald-500 text-white"
              }`}
            >
              1
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Pembuatan draf</div>
              <p className="text-[11px] text-slate-500">Mengisi data item dan nominal harga.</p>
            </div>
          </div>

          {/* Step 2: Kirim ke Pelanggan */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 2
                  ? "bg-[#19376d] text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              2
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Kirim ke pelanggan</div>
              <p className="text-[11px] text-slate-500">Dokumen PDF dikirimkan untuk ditinjau.</p>
            </div>
          </div>

          {/* Step 3: Konversi Transaksi */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 3
                  ? "bg-[#19376d] text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Konversi transaksi</div>
              <p className="text-[11px] text-slate-500">Disetujui dan dialihkan menjadi invoice resmi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

