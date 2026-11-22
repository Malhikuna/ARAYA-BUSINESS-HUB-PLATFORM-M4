"use client";

import React from "react";
import { Mail, BadgeCheck, FolderKanban, Clock, FileText, CheckCircle2 } from "lucide-react";

export interface PermintaanMetricCardsProps {
  newCount: number;
  offeredCount: number;
  totalCount: number;
}

/**
 * 3 Kartu Metrik Ringkasan Modul Permintaan
 * Menampilkan: Permintaan baru, Sudah ditawarkan, dan Total permintaan berbasis data aktual.
 */
export function PermintaanMetricCards({
  newCount,
  offeredCount,
  totalCount,
}: PermintaanMetricCardsProps) {
  const responseRate = totalCount > 0 ? Math.round((offeredCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-5 sm:mb-6">
      {/* 1. Permintaan Baru */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Permintaan baru</span>
          <div className="w-8 h-8 rounded-lg bg-[#eef4ff] text-[#19376d] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 leading-none">
            {newCount}
          </span>
          {newCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#d5f0f6] text-[#0f5368]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0e7490]" />
              Menunggu respon
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Semua tertangani
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{newCount > 0 ? "Perlu ditinjau untuk penawaran harga" : "Tidak ada antrean permintaan baru"}</span>
        </div>
      </div>

      {/* 2. Sudah Ditawarkan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Sudah ditawarkan</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 leading-none">
            {offeredCount}
          </span>
          <span className="text-xs text-slate-400">dari {totalCount} permintaan</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Penawaran sudah dibuat untuk permintaan ini</span>
        </div>
      </div>

      {/* 3. Total Permintaan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-2.5 sm:space-y-3 @md:col-span-2 @2xl:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Total permintaan</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 leading-none">
            {totalCount}
          </span>
          <span className="text-xs text-slate-400">permintaan masuk</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {totalCount > 0 ? (
            <span>
              <strong className="text-slate-700 font-semibold">{responseRate}%</strong> sudah ditindaklanjuti
            </span>
          ) : (
            <span>Belum ada permintaan masuk</span>
          )}
        </div>
      </div>
    </div>
  );
}
