"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Quotation, QuotationStatus } from "@/types/quotation";

export interface QuotationEditModalProps {
  quotation: Quotation | null;
  onClose: () => void;
  onSave: (updated: Quotation) => void;
}

/**
 * Modal edit ringkas informasi penawaran harga.
 */
export function QuotationEditModal({
  quotation,
  onClose,
  onSave,
}: QuotationEditModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState<QuotationStatus>("PENDING_APPROVAL");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!quotation) return;
    const timer = window.setTimeout(() => {
      setCustomerName(quotation.customer_name);
      setQuotationDate(quotation.quotation_date);
      setValidUntil(quotation.valid_until || "");
      setStatus(quotation.status);
      setNotes(quotation.notes || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [quotation]);

  useEffect(() => {
    if (!quotation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quotation, onClose]);

  if (!quotation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    onSave({
      ...quotation,
      customer_name: customerName.trim(),
      quotation_date: quotationDate,
      valid_until: validUntil || undefined,
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px] animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-quotation-modal-title"
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef4ff] text-[#19376d] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="edit-quotation-modal-title"
                className="text-base font-bold text-slate-900 font-heading"
              >
                Ubah Dokumen Penawaran
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{quotation.quotation_number}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Peringatan Status Terkunci Sesuai BR-06 & BR-07 */}
        {quotation.status !== "DRAFT" && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {quotation.status === "APPROVED"
                ? "Penawaran ini sudah disetujui customer dan terkunci total (Read-Only) sesuai aturan BR-07."
                : "Penawaran ini berstatus terkirim ke customer sehingga rincian harga dan dokumen tidak dapat diubah lagi."}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Pelanggan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={quotation.status !== "DRAFT"}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] ${
                quotation.status !== "DRAFT" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penawaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={quotation.status !== "DRAFT"}
                value={quotationDate}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => {
                  setQuotationDate(e.target.value);
                  if (e.target.value && (!validUntil || validUntil < e.target.value)) {
                    setValidUntil(e.target.value);
                  }
                }}
                className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer ${
                  quotation.status !== "DRAFT" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku
              </label>
              <input
                type="date"
                disabled={quotation.status !== "DRAFT"}
                min={quotationDate || undefined}
                value={validUntil}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => setValidUntil(e.target.value)}
                className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer ${
                  quotation.status !== "DRAFT" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Dokumen
            </label>
            <div className="flex items-center h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {quotation.status === "APPROVED" ? (
                <span className="font-semibold text-emerald-700">Disetujui (Terkunci total)</span>
              ) : quotation.status === "DRAFT" ? (
                <span className="font-semibold text-slate-700">Draf (Dapat disunting)</span>
              ) : (
                <span className="font-semibold text-amber-700">Terkirim (Menunggu persetujuan customer)</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penawaran
            </label>
            <textarea
              rows={3}
              disabled={quotation.status !== "DRAFT"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] ${
                quotation.status !== "DRAFT" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
              }`}
              placeholder="Syarat, ketentuan, atau instruksi pembayaran..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              {quotation.status !== "DRAFT" ? "Tutup" : "Batal"}
            </button>
            {quotation.status === "DRAFT" && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
