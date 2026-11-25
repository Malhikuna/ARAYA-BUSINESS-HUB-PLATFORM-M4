import React from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

/**
 * Pemberitahuan saat formulir penawaran dibuka tanpa permintaan rujukan.
 * BR-06 & BR-13: penawaran selalu dibuat dari satu permintaan customer.
 */
export function QuotationRequiresPermintaanNotice() {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#eef4ff] text-[#19376d] flex items-center justify-center mx-auto">
        <ClipboardList className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-base font-heading font-bold text-slate-900">
          Penawaran dibuat dari permintaan
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Pilih permintaan berstatus Baru, buka detailnya, lalu tekan &ldquo;Buat penawaran&rdquo;.
          Setiap permintaan hanya dapat memiliki satu penawaran.
        </p>
      </div>
      <Link
        href="/permintaan"
        className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
      >
        Buka daftar permintaan
      </Link>
    </div>
  );
}
