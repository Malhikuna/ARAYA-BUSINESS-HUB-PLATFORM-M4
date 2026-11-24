"use client";

import React from "react";
import { MessageCircle, Pencil, ReceiptText } from "lucide-react";
import { CanonicalQuotationStatus } from "@/lib/quotation-helpers";

export interface QuotationDetailHeaderProps {
  quotationNumber: string;
  canonicalStatus: CanonicalQuotationStatus;
  isSendingWa: boolean;
  onEdit: () => void;
  onCreateInvoice: () => void;
  onSendWhatsApp: () => void;
}

/**
 * Header halaman detail penawaran Partner Jasa (UC-04): nomor dokumen, badge status, dan tombol aksi.
 */
export function QuotationDetailHeader({
  quotationNumber,
  canonicalStatus,
  isSendingWa,
  onEdit,
  onCreateInvoice,
  onSendWhatsApp,
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

        {(isSent || isApproved) && (
          <button
            type="button"
            onClick={onSendWhatsApp}
            disabled={isSendingWa}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{isSendingWa ? "Mengirim..." : "Kirim ulang WA"}</span>
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
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xs transition-colors ${
            isApproved
              ? "border-[#19376d] text-white bg-[#19376d] hover:bg-[#122852] cursor-pointer"
              : "border-slate-100 text-slate-400 bg-slate-50 cursor-not-allowed opacity-60 font-semibold"
          }`}
        >
          <ReceiptText className={`w-4 h-4 ${isApproved ? "text-white" : "text-slate-400"}`} />
          <span>Buat invoice</span>
        </button>

        {isDraft && (
          <button
            type="button"
            onClick={onSendWhatsApp}
            disabled={isSendingWa}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isSendingWa ? "Mengirim..." : "Kirim ke WhatsApp"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
