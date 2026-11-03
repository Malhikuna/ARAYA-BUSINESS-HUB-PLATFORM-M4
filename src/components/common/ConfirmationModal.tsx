"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, X } from "lucide-react";

export type ConfirmationModalVariant = "primary" | "success" | "danger";

export interface ConfirmationModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmationModal({
  open,
  title,
  subtitle = "Konfirmasi tindakan sebelum melanjutkan",
  description,
  confirmLabel,
  cancelLabel = "Batal",
  variant = "primary",
  onConfirm,
  onCancel,
  children,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const badgeStyle =
    variant === "danger"
      ? "bg-rose-50 border-rose-200/80 text-rose-600"
      : variant === "success"
      ? "bg-emerald-50 border-emerald-200/80 text-emerald-600"
      : "bg-[#eef4ff] border-blue-200/80 text-[#19376d]";

  const confirmButtonStyle =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : "bg-[#19376d] hover:bg-[#122852] text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px] animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badgeStyle}`}
            >
              {variant === "danger" ? (
                <AlertTriangle aria-hidden="true" className="w-5 h-5" />
              ) : variant === "success" ? (
                <CheckCircle2 aria-hidden="true" className="w-5 h-5" />
              ) : (
                <ShieldCheck aria-hidden="true" className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="confirmation-modal-title"
                className="text-base font-heading font-bold text-slate-900"
              >
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup dialog konfirmasi"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Data (Opsional) */}
        {children && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5">
            {children}
          </div>
        )}

        {/* Pesan Penjelasan */}
        <p
          id="confirmation-modal-description"
          className="text-xs text-slate-600 leading-relaxed"
        >
          {description}
        </p>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 h-10 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${confirmButtonStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

