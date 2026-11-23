"use client";

import React from "react";
import { CheckCircle2, MessageCircle, Pencil, ReceiptText } from "lucide-react";
import { CanonicalQuotationStatus } from "@/lib/quotation-helpers";

export interface QuotationDetailHeaderProps {
  quotationNumber: string;
  canonicalStatus: CanonicalQuotationStatus;
  isCustomer: boolean;
  isSendingWa: boolean;
  isApproving: boolean;
  onEdit: () => void;
  onCreateInvoice: () => void;
  onSendWhatsApp: () => void;
  onRequestCustomerApprove: () => void;
}

/**
 * Header halaman detail penawaran: nomor dokumen, badge status, dan tombol aksi
 * terpisah secara ketat antara peran Partner Jasa (UC-04) dan Customer M1 (UC-05).
 */
export function QuotationDetailHeader({
  quotationNumber,
  canonicalStatus,
  isCustomer,
  isSendingWa,
  isApproving,
  onEdit,
  onCreateInvoice,
  onSendWhatsApp,
  onRequestCustomerApprove,
}: QuotationDetailHeaderProps) {
  const isDraft = canonicalStatus === "DRAFT";
  const isSent = canonicalStatus === "SENT";
  const isApproved = canonicalStatus === "APPROVED";
  const isRejected = canonicalStatus === "REJECTED";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Penawaran {quotationNumber}
          </h1>
          {isDraft ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Draf</span>
            </span>
          ) : isSent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Terkirim</span>
            </span>
          ) : isApproved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Disetujui</span>
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Ditolak</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
        {isCustomer ? (
          isSent ? (
            <button
              type="button"
              onClick={onRequestCustomerApprove}
              disabled={isApproving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#19376d] hover:bg-[#122852] disabled:opacity-60 shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApproving ? "Menyetujui..." : "Setujui"}</span>
            </button>
          ) : null
        ) : (
          <>
            {isDraft && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                <span>Ubah</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCreateInvoice}
              disabled={!isApproved}
              title={
                isApproved
                  ? "Buat tagihan invoice"
                  : "Invoice hanya dapat dibuat setelah penawaran disetujui customer (BR-07)"
              }
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
                isApproved
                  ? "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                  : "border-slate-100 text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
              }`}
            >
              <ReceiptText className="w-4 h-4 text-slate-400" />
              <span>Buat invoice</span>
            </button>

            {isDraft ? (
              <button
                type="button"
                onClick={onSendWhatsApp}
                disabled={isSendingWa}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isSendingWa ? "Mengirim..." : "Kirim ke WhatsApp"}</span>
              </button>
            ) : isSent ? (
              <button
                type="button"
                onClick={onSendWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Kirim ulang</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
