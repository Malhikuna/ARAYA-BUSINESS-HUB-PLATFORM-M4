"use client";

import React from "react";
import { FileText } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { DEFAULT_PPN_RATE } from "@/lib/quotation-helpers";

export interface QuotationNotesAndTotalCardProps {
  notes: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  onNotesChange: (val: string) => void;
  onTaxRateChange?: (rate: number) => void;
}

/**
 * Helper ukuran font responsif untuk nominal penawaran besar (ratusan juta, miliaran, triliunan).
 */
function getTotalFontSize(amount: number): string {
  if (amount >= 1_000_000_000_000) return "text-xs sm:text-sm";
  if (amount >= 1_000_000_000) return "text-sm sm:text-base";
  if (amount >= 100_000_000) return "text-base sm:text-lg";
  return "text-lg sm:text-xl";
}

/**
 * Card Catatan untuk Customer dan Box Ringkasan Penawaran (Subtotal, PPN 11%, & Total).
 */
export function QuotationNotesAndTotalCard({
  notes,
  subtotal,
  taxRate = DEFAULT_PPN_RATE,
  taxAmount = 0,
  totalAmount,
  onNotesChange,
  onTaxRateChange,
}: QuotationNotesAndTotalCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileText className="w-4 h-4 text-[#19376d]" />
        <h2 className="text-sm font-bold text-slate-900">Catatan untuk customer</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <textarea
            id="quotation-notes"
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Tambahkan catatan khusus untuk customer pada dokumen penawaran..."
            className="w-full p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all resize-none min-h-24"
          />
          <p className="text-[11px] text-slate-400">
            Catatan ini akan tercantum di lembar penawaran resmi.
          </p>
        </div>

        {/* Box Ringkasan Penawaran: Subtotal, PPN (default 11% UU HPP), & Total */}
        <div className="w-full bg-[#f0f4fa] rounded-2xl p-4 sm:p-5 space-y-3 border border-blue-100/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span
              className="font-semibold text-slate-900 text-right whitespace-nowrap tabular-nums"
              title={formatRupiah(subtotal)}
            >
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="quotation-ppn-rate" className="text-slate-600 font-medium">
                Pajak (PPN {taxRate}%)
              </label>
              {onTaxRateChange && (
                <select
                  id="quotation-ppn-rate"
                  aria-label="Pilih tarif PPN penawaran"
                  value={String(taxRate)}
                  onChange={(e) => onTaxRateChange(Number(e.target.value))}
                  className="h-7 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-[#19376d] outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer"
                >
                  <option value="11">11% (Standar UU HPP)</option>
                  <option value="0">0% (Bebas PPN)</option>
                </select>
              )}
            </div>
            <span
              className="font-semibold text-slate-900 text-right whitespace-nowrap tabular-nums"
              title={formatRupiah(taxAmount)}
            >
              {formatRupiah(taxAmount)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-4">
            <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0 uppercase tracking-wider">
              Total
            </span>
            <span
              className={`font-heading font-bold text-[#19376d] text-right whitespace-nowrap tabular-nums shrink-0 ${getTotalFontSize(
                totalAmount
              )}`}
              title={formatRupiah(totalAmount)}
            >
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
