"use client";

import React from "react";
import { MessageCircle, ShieldCheck, CheckCheck } from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo } from "@/lib/data/mock-quotations";

export interface QuotationWhatsAppPreviewCardProps {
  quotation: Quotation;
  onSendToWhatsApp: () => void;
}

/**
 * Card Pratinjau pesan WhatsApp pada halaman detail penawaran Draf.
 * Sesuai desain Figma M4-US2 (Image 1 & 2).
 */
export function QuotationWhatsAppPreviewCard({
  quotation,
  onSendToWhatsApp,
}: QuotationWhatsAppPreviewCardProps) {
  const contactName = quotation.customer_name.replace(/^(PT|CV|UD)\s+/i, "").split(" ")[0] || "Budi";
  const pmtTitle = quotation.permintaan_title || quotation.items[0]?.name || "Pendampingan laporan keuangan Q4";
  const validUntilStr = quotation.valid_until ? formatTanggalIndo(quotation.valid_until) : "1 Des 2026";
  const formattedTotal = formatRupiah(quotation.total_amount);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
      {/* Header Card */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">Pratinjau pesan WhatsApp</h2>
          <p className="text-[11px] text-slate-400">Pesan yang akan dikirim ke customer</p>
        </div>
      </div>

      {/* Bubble Chat WhatsApp */}
      <div className="bg-[#e7fce3] border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed shadow-2xs space-y-2 font-sans">
        <p>
          Halo <strong>{contactName}</strong>, berikut penawaran <strong>{quotation.quotation_number}</strong> dari Araya Konsultan untuk <strong>{pmtTitle}</strong>.
        </p>
        <p>
          Total <strong>{formattedTotal}</strong>, berlaku sampai {validUntilStr}. Lihat dan setujui di:
        </p>
        <p className="text-emerald-700 font-semibold underline break-all">
          araya.id/penawaran/{quotation.quotation_number}
        </p>
        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
          <span>10:05</span>
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>

      {/* Catatan Dokumen */}
      <div className="flex items-start gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>Dokumen resmi dan tautan persetujuan daring otomatis disertakan.</span>
      </div>

      {/* Tombol Kirim ke WhatsApp */}
      <button
        type="button"
        onClick={onSendToWhatsApp}
        className="w-full h-11 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Kirim ke WhatsApp</span>
      </button>
    </div>
  );
}
