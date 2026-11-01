import React from "react";
import { AlertCircle } from "lucide-react";

export interface FormAlertBannerProps {
  visible: boolean;
  title?: string;
  description?: string;
}

export function FormAlertBanner({
  visible,
  title = "Data belum lengkap",
  description = "Lengkapi kolom yang ditandai merah, lalu simpan lagi.",
}: FormAlertBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex items-start gap-3.5 shadow-2xs transition-all animate-in fade-in duration-200"
    >
      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
        <AlertCircle className="w-4 h-4 text-red-600" />
      </div>
      <div className="flex-1">
        <div className="font-heading font-bold text-sm text-red-900">
          {title}
        </div>
        <div className="text-xs text-red-700 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

