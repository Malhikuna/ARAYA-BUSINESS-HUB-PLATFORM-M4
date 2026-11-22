"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Quotation, QuotationStatus } from "@/types/quotation";
import { normalizeQuotationStatus } from "@/lib/data/mock-quotations";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

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
  const [pendingUpdate, setPendingUpdate] = useState<Quotation | null>(null);

  useEffect(() => {
    if (!quotation) return;
    const timer = window.setTimeout(() => {
      setCustomerName(quotation.customer_name);
      setQuotationDate(quotation.quotation_date);
      setValidUntil(quotation.valid_until || "");
      setStatus(quotation.status);
      setNotes(quotation.notes || "");
      setPendingUpdate(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [quotation]);

  useEffect(() => {
    if (!quotation || pendingUpdate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quotation, pendingUpdate, onClose]);

  if (!quotation) return null;

  const canonicalStatus = normalizeQuotationStatus(quotation.status);
  const isDraft = canonicalStatus === "DRAFT";
  const isApproved = canonicalStatus === "APPROVED";
  const isRejected = canonicalStatus === "REJECTED";
  const isCustomerLocked = !isDraft || Boolean(quotation.permintaan_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDraft || !customerName.trim()) return;

    setPendingUpdate({
      ...quotation,
      customer_name: quotation.permintaan_id ? quotation.customer_name : customerName.trim(),
      quotation_date: quotationDate,
      valid_until: validUntil || undefined,
      status,
      notes: notes.trim() || undefined,
    });
  };

  const handleConfirmSave = () => {
    if (!pendingUpdate) return;
    const updated = pendingUpdate;
    setPendingUpdate(null);
    onSave(updated);
  };

  return (
    <>
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
        {!isDraft && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {isApproved
                ? "Penawaran ini sudah disetujui customer dan terkunci total (Read-Only) sesuai aturan BR-07."
                : isRejected
                ? "Penawaran ini berstatus ditolak customer dan terkunci sehingga tidak dapat diubah lagi."
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
              disabled={isCustomerLocked}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] ${
                isCustomerLocked ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
              }`}
            />
            {quotation.permintaan_id && (
              <p className="text-[11px] text-slate-400 mt-1">
                Terkunci mengikuti data pelanggan pada permintaan {quotation.permintaan_id}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penawaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={!isDraft}
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
                  !isDraft ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku
              </label>
              <input
                type="date"
                disabled={!isDraft}
                min={quotationDate || undefined}
                value={validUntil}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => setValidUntil(e.target.value)}
                className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer ${
                  !isDraft ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Dokumen
            </label>
            <div className="flex items-center h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {isApproved ? (
                <span className="font-semibold text-emerald-700">Disetujui (Terkunci total)</span>
              ) : isDraft ? (
                <span className="font-semibold text-slate-700">Draf (Dapat disunting)</span>
              ) : isRejected ? (
                <span className="font-semibold text-rose-700">Ditolak (Terkunci)</span>
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
              disabled={!isDraft}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#19376d] ${
                !isDraft ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
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
              {!isDraft ? "Tutup" : "Batal"}
            </button>
            {isDraft && (
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

      <ConfirmationModal
        open={Boolean(pendingUpdate)}
        title="Simpan perubahan penawaran?"
        subtitle="Konfirmasi pembaruan dokumen penawaran"
        description="Pastikan informasi pelanggan, tanggal penawaran, masa berlaku, dan catatan sudah sesuai sebelum menyimpan perubahan."
        confirmLabel="Ya, simpan perubahan"
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setPendingUpdate(null)}
      >
        {pendingUpdate && (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Nomor penawaran</span>
              <span className="font-mono font-bold text-slate-900">{pendingUpdate.quotation_number}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-semibold text-slate-800 truncate">{pendingUpdate.customer_name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Tanggal penawaran</span>
              <span className="font-semibold text-slate-800">{pendingUpdate.quotation_date || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Masa berlaku</span>
              <span className="font-semibold text-slate-800">{pendingUpdate.valid_until || "-"}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </>
  );
}
