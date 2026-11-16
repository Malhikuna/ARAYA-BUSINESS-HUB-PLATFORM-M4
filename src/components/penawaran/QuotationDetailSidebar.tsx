"use client";

import React from "react";
import { FileText, Mail, Download, Printer } from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { hitungMasaBerlaku, getQuotationActivities } from "@/lib/data/mock-quotations";

export interface QuotationDetailSidebarProps {
  quotation: Quotation;
  onDownloadPdf: () => void;
  onPrint: () => void;
}

/**
 * Sidebar kanan halaman detail penawaran: Ringkasan dokumen & Riwayat aktivitas.
 */
export function QuotationDetailSidebar({
  quotation,
  onDownloadPdf,
  onPrint,
}: QuotationDetailSidebarProps) {
  const { sisaHariLabel } = hitungMasaBerlaku(quotation.quotation_date, quotation.valid_until);
  const activities = getQuotationActivities(quotation);

  return (
    <div className="space-y-6">
      {/* 1. Card Ringkasan Dokumen */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-[#19376d]" />
          <h2 className="text-base font-bold text-slate-900">Ringkasan dokumen</h2>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Nilai transaksi</span>
            <span className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
              {formatRupiah(quotation.total_amount)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sisa masa aktif</span>
              <span className="font-semibold text-slate-800">{sisaHariLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status pengiriman</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>Terkirim via email</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh format PDF</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak dokumen</span>
          </button>
        </div>
      </div>

      {/* 2. Card Riwayat Aktivitas */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Riwayat aktivitas</h2>
          <span className="text-xs text-slate-400 font-medium">
            {activities.length} aktivitas
          </span>
        </div>

        <div className="relative pl-5 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {activities.map((act, idx) => {
            const isFirst = idx === 0;
            return (
              <div key={act.id || idx} className="relative">
                {/* Bullet dot */}
                <span
                  className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                    isFirst ? "bg-[#0e7490]" : "bg-slate-400"
                  }`}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{act.title}</span>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">{act.time}</span>
                </div>
                {act.description ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {act.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

