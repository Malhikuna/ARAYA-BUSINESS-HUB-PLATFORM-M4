import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

export interface FormAlertBannerProps {
  visible: boolean;
  title?: string;
  description?: string | React.ReactNode;
  onClose?: () => void;
  className?: string;
  autoDismissMs?: number;
}

/**
 * Banner notifikasi peringatan / error formulir yang dapat ditutup otomatis atau manual.
 * Default auto-dismiss: 5000ms (5 detik) sesuai standar UX alert industri.
 */
export function FormAlertBanner({
  visible,
  title = "Data belum lengkap",
  description = "Lengkapi kolom yang ditandai merah, lalu simpan lagi.",
  onClose,
  className = "mb-6",
  autoDismissMs = 5000,
}: FormAlertBannerProps) {
  useEffect(() => {
    if (!visible || !onClose || !autoDismissMs || autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [visible, onClose, autoDismissMs]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-2xl border border-red-200/90 bg-[#fef2f2] text-red-900 flex items-start justify-between gap-4 shadow-2xs transition-all animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-red-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="font-bold text-sm text-red-900 tracking-tight">
            {title}
          </div>
          <div className="text-xs sm:text-sm text-red-700 mt-1 leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-red-400 hover:text-red-700 transition-colors p-1 rounded-lg cursor-pointer shrink-0 -mr-1 -mt-1"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
