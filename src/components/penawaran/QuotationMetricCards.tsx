"use client";

import React from "react";
import { FileText, Send, CheckCircle2 } from "lucide-react";

export interface QuotationMetricCardsProps {
  drafCount: number;
  terkirimCount: number;
  disetujuiCount: number;
  isCustomer?: boolean;
  totalCount?: number;
}

/**
 * 3 Kartu Metrik Ringkasan Modul Penawaran (adaptif untuk Partner Jasa & Customer M1).
 */
export function QuotationMetricCards({
  drafCount,
  terkirimCount,
  disetujuiCount,
  isCustomer = false,
  totalCount,
}: QuotationMetricCardsProps) {
  const firstLabel = isCustomer ? "Total penawaran" : "Draf";
  const firstCount = isCustomer ? (totalCount ?? terkirimCount + disetujuiCount) : drafCount;
  const firstCaption = isCustomer ? "penawaran masuk" : "penawaran draf";
  const secondLabel = isCustomer ? "Menunggu persetujuan" : "Terkirim";
  const secondCaption = isCustomer ? "perlu ditinjau" : "penawaran terkirim";

  return (
    <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-5 sm:mb-6">
      {/* 1. Draf / Total penawaran */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span className="text-xs font-medium text-slate-500">{firstLabel}</span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{firstCount}</span>
            <span className="text-xs text-slate-400">{firstCaption}</span>
          </div>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* 2. Terkirim / Menunggu persetujuan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span className="text-xs font-medium text-slate-500">{secondLabel}</span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{terkirimCount}</span>
            <span className="text-xs text-slate-400">{secondCaption}</span>
          </div>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* 3. Disetujui */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 @md:col-span-2 @2xl:col-span-1">
        <div className="space-y-1 min-w-0">
          <span className="text-xs font-medium text-slate-500">Disetujui</span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{disetujuiCount}</span>
            <span className="text-xs text-slate-400">penawaran disetujui</span>
          </div>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}
