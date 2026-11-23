"use client";

import React from "react";
import { CheckCircle2, Info, ShieldCheck, UserCheck, Wrench } from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export interface QuotationViewerDevToggleProps {
  isCustomer: boolean;
  onToggle: (nextCustomerMode: boolean) => void;
}

/**
 * Pengalih pratinjau lokal (khusus dev-mode) untuk menguji tampilan Partner Jasa vs Customer M1 (UC-05).
 */
export function QuotationViewerDevToggle({
  isCustomer,
  onToggle,
}: QuotationViewerDevToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#eef4ff] border border-blue-100 text-xs">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          !isCustomer ? "bg-white text-[#19376d] shadow-2xs" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>Partner Jasa</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          isCustomer ? "bg-[#19376d] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>Customer M1</span>
      </button>
    </div>
  );
}

export interface QuotationCustomerStatusBannerProps {
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  quotationNumber: string;
}

/**
 * Banner informasi status khusus tampilan Customer login M1 pada halaman detail penawaran (UC-05).
 */
export function QuotationCustomerStatusBanner({
  status,
  quotationNumber,
}: QuotationCustomerStatusBannerProps) {
  if (status === "SENT") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Menunggu persetujuan Anda</p>
          <p className="text-amber-800 leading-relaxed">
            Periksa rincian layanan jasa dan total biaya pada penawaran{" "}
            <span className="font-mono font-semibold">{quotationNumber}</span>. Klik tombol{" "}
            <strong>Setujui</strong> di kanan atas jika Anda sepakat agar Partner dapat menerbitkan invoice.
          </p>
        </div>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Penawaran telah Anda setujui</p>
          <p className="text-emerald-800 leading-relaxed">
            Persetujuan tercatat untuk dokumen{" "}
            <span className="font-mono font-semibold">{quotationNumber}</span>. Partner jasa kini
            dapat menerbitkan invoice resmi untuk layanan ini.
          </p>
        </div>
      </div>
    );
  }

  if (status === "DRAFT") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Penawaran masih berupa draf</p>
          <p className="text-slate-600 leading-relaxed">
            Dokumen ini belum dikirimkan oleh Partner. Tombol persetujuan akan aktif setelah status penawaran menjadi Terkirim.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export interface QuotationCustomerApproveModalProps {
  open: boolean;
  quotation: Quotation;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal konfirmasi persetujuan penawaran oleh Customer M1 (UC-05 / M4-US2-AC3).
 */
export function QuotationCustomerApproveModal({
  open,
  quotation,
  isSubmitting,
  onConfirm,
  onCancel,
}: QuotationCustomerApproveModalProps) {
  return (
    <ConfirmationModal
      open={open}
      title="Setujui penawaran jasa ini?"
      subtitle="Konfirmasi persetujuan penawaran (UC-05)"
      description="Setelah disetujui, status penawaran akan berubah menjadi Disetujui dan Partner jasa dapat menerbitkan invoice untuk transaksi ini."
      confirmLabel={isSubmitting ? "Memproses..." : "Ya, setujui penawaran"}
      variant="primary"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Nomor penawaran</span>
          <span className="font-mono font-bold text-slate-900">{quotation.quotation_number}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Jumlah layanan</span>
          <span className="font-semibold text-slate-800">{quotation.items.length} item jasa</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-200/80">
          <span className="font-semibold text-slate-700">Total penawaran</span>
          <span className="font-heading font-bold text-[#19376d]">
            {formatRupiah(quotation.total_amount)}
          </span>
        </div>
      </div>
    </ConfirmationModal>
  );
}
