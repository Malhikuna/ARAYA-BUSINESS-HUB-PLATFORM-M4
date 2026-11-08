import React from "react";
import { Info, AlertTriangle } from "lucide-react";

export interface ProductCatalogSidebarProps {
  mode: "create" | "edit" | "detail";
  categoryLabel: string;
  displayName: string;
  isNameFilled: boolean;
  descriptionText: string;
  previewPrice: string;
  hasSubmittedError?: boolean;
  hasPriceError?: boolean;
  sku?: string;
}

export function ProductCatalogSidebar({
  mode,
  categoryLabel,
  displayName,
  isNameFilled,
  descriptionText,
  previewPrice,
  hasSubmittedError = false,
  hasPriceError = false,
  sku,
}: ProductCatalogSidebarProps) {
  return (
    <div className="lg:col-span-5 space-y-4">
      {/* Card 1: Pratinjau Tampilan Katalog */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-300/90">
        <div className="flex items-center justify-between gap-2 pb-2.5">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Pratinjau tampilan katalog
          </span>
          {hasSubmittedError ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
              <span>Data belum lengkap</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6eef8] text-[#19376d]">
              {categoryLabel}
            </span>
          )}
        </div>

        <div className="py-3 border-y border-slate-300 space-y-1">
          <h2 className={`text-base sm:text-lg font-heading font-bold wrap-break-word ${isNameFilled ? "text-slate-900" : "text-slate-500"}`}>
            {displayName}
          </h2>
          <p className="text-xs text-slate-500 italic leading-relaxed wrap-break-word">
            {descriptionText}
          </p>
        </div>

        <div className="pt-3 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500 font-medium">Tarif acuan</span>
          <span className={`text-lg sm:text-xl font-heading font-bold ${hasPriceError ? "text-red-700" : "text-[#19376d]"}`}>
            {previewPrice}
          </span>
        </div>
      </div>

      {/* Card 2: Ketentuan Integrasi Buku Besar */}
      <div className="bg-[#e6eef8] rounded-2xl p-5 border border-[#c5d5ea] flex items-start gap-3.5">
        <Info aria-hidden="true" className="w-5 h-5 text-[#0e7490] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-heading font-bold text-slate-900">
            Ketentuan integrasi buku besar
          </h3>
          {mode === "detail" && sku ? (
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Entri ini terhubung ke kode akun pendapatan (Akun 4-4000) dengan kode referensi{" "}
              <span className="font-mono font-semibold text-slate-800">{sku}</span>.
            </p>
          ) : (
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {mode === "edit"
                ? "Setiap pembaruan entri akan otomatis disinkronkan ke kode akun pendapatan (Akun 4-4000). Anda dapat menyesuaikan pemetaan akun khusus melalui menu Pengaturan Finansial."
                : "Setiap penambahan entri akan otomatis terhubung ke kode akun pendapatan (Akun 4-4000). Anda dapat menyesuaikan pemetaan akun khusus melalui menu Pengaturan Finansial."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

