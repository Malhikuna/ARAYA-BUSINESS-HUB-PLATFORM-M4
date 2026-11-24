"use client";

import React from "react";
import { CheckCircle2, ReceiptText } from "lucide-react";

export interface QuotationPartnerApprovedBannerProps {
  customerName: string;
  approvedAtLabel?: string;
  onCreateInvoice: () => void;
}

/**
 * Banner hijau di halaman detail penawaran Partner Jasa saat Customer telah menyetujui penawaran (UC-05 -> UC-06).
 */
export function QuotationPartnerApprovedBanner({
  customerName,
  approvedAtLabel,
  onCreateInvoice,
}: QuotationPartnerApprovedBannerProps) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-start gap-3 min-w-0">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0">
          <p className="font-bold text-emerald-950">
            Disetujui oleh customer ({customerName})
            {approvedAtLabel ? ` pada ${approvedAtLabel}` : ""}.
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Invoice sekarang dapat dibuat dan diterbitkan langsung untuk penagihan.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateInvoice}
        className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      >
        <ReceiptText className="w-4 h-4" />
        <span>Buat invoice sekarang</span>
      </button>
    </div>
  );
}
