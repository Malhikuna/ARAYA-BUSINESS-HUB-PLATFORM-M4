import React from "react";
import Link from "next/link";
import { AlertCircle, ClipboardList } from "lucide-react";

export interface QuotationRequiresPermintaanNoticeProps {
  missingId?: string;
}

/**
 * Pemberitahuan saat formulir penawaran dibuka tanpa permintaan rujukan atau ID permintaan tidak ditemukan.
 * BR-06 & BR-13: penawaran selalu dibuat dari satu permintaan customer yang valid.
 */
export function QuotationRequiresPermintaanNotice({
  missingId,
}: QuotationRequiresPermintaanNoticeProps) {
  const isNotFound = Boolean(missingId);

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
          isNotFound ? "bg-rose-50 text-rose-600" : "bg-[#eef4ff] text-[#19376d]"
        }`}
      >
        {isNotFound ? <AlertCircle className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
      </div>
      <div>
        <h2 className="text-base font-heading font-bold text-slate-900">
          {isNotFound ? "Permintaan tidak ditemukan" : "Penawaran dibuat dari permintaan"}
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {isNotFound ? (
            <>
              Permintaan dengan kode{" "}
              <span className="font-mono font-semibold text-slate-700">{missingId}</span> tidak
              ditemukan. Silakan pilih permintaan valid dari daftar permintaan.
            </>
          ) : (
            <>
              Pilih permintaan berstatus Baru, buka detailnya, lalu tekan &ldquo;Buat penawaran&rdquo;.
              Setiap permintaan hanya dapat memiliki satu penawaran.
            </>
          )}
        </p>
      </div>
      <Link
        href="/permintaan"
        className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
      >
        {isNotFound ? "Kembali ke daftar permintaan" : "Buka daftar permintaan"}
      </Link>
    </div>
  );
}
