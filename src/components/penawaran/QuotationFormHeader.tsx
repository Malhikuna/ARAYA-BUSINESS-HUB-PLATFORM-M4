"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { useDevRole } from "@/lib/auth/dev-role";

export interface QuotationFormHeaderProps {
  isError: boolean;
  permintaanId?: string;
}

/**
 * Header halaman Buat Penawaran: Judul, badge mitra, deskripsi, dan info penyusun.
 */
export function QuotationFormHeader({ isError, permintaanId }: QuotationFormHeaderProps) {
  const { profile } = useDevRole();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-heading font-bold tracking-tight text-slate-900">
            {isError ? "Validasi error — Buat penawaran" : "Buat penawaran"}
          </h1>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#19376d]">
            Mitra: {profile.name} | {profile.businessMode}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {permintaanId
            ? `Terbitkan dokumen penawaran harga resmi dari permintaan layanan customer ${permintaanId}`
            : "Terbitkan dokumen penawaran harga resmi untuk pelanggan."}
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-center">
        <ShieldCheck className="w-4 h-4 text-[#19376d]" />
        <span>Penyusun: {profile.name} ({profile.roleLabel})</span>
      </div>
    </div>
  );
}
