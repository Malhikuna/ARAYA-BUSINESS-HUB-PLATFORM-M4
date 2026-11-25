"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ExternalLink, X } from "lucide-react";

export interface QuotationValidationBannerProps {
  message: string | null;
  type?: "error" | "warning";
  actionHref?: string;
  actionLabel?: string;
  onDismiss: () => void;
}

/**
 * Banner pesan peringatan error validasi form Buat Penawaran.
 * Sesuai desain Figma M4-US2 saat field wajib/jumlah item belum valid atau permintaan sudah ditawarkan.
 */
export function QuotationValidationBanner({
  message,
  type = "error",
  actionHref,
  actionLabel,
  onDismiss,
}: QuotationValidationBannerProps) {
  if (!message) return null;

  const isWarning = type === "warning";

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border transition-all ${
        isWarning
          ? "bg-amber-50/90 border-amber-200 text-amber-900"
          : "bg-red-50/90 border-red-200 text-red-800"
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
        )}
        <span className="font-medium text-xs sm:text-sm leading-relaxed">{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              isWarning
                ? "bg-[#19376d] hover:bg-[#122852] text-white shadow-xs"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            <span>{actionLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isWarning
              ? "text-amber-600 hover:bg-amber-100 hover:text-amber-800"
              : "text-red-500 hover:bg-red-100 hover:text-red-700"
          }`}
          title="Tutup pesan peringatan"
          aria-label="Tutup pesan peringatan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
