"use client";

import React from "react";
import { FileText, ShieldCheck, Clock } from "lucide-react";

export interface QuotationMetricCardsProps {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
}

/**
 * 3 Kartu Metrik Ringkasan Modul Penawaran (Total, Disetujui, Menunggu persetujuan).
 */
export function QuotationMetricCards({
  totalCount,
  approvedCount,
  pendingCount,
}: QuotationMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {/* 1. Total Penawaran */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">Total penawaran</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400">penawaran terdaftar</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Disetujui */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">Disetujui</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{approvedCount}</span>
            <span className="text-xs text-slate-400">penawaran disetujui</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Menunggu Persetujuan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">Menunggu persetujuan</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{pendingCount}</span>
            <span className="text-xs text-slate-400">penawaran menunggu</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
