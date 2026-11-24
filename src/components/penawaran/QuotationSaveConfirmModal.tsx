"use client";

import React from "react";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { formatRupiah } from "@/lib/format";

export interface QuotationSaveConfirmModalProps {
  open: boolean;
  isSubmitting: boolean;
  quotationNumber: string;
  requestCode: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal konfirmasi penyimpanan draf penawaran baru dari permintaan jasa (UC-04).
 */
export function QuotationSaveConfirmModal({
  open,
  isSubmitting,
  quotationNumber,
  requestCode,
  customerName,
  itemsCount,
  totalAmount,
  onConfirm,
  onCancel,
}: QuotationSaveConfirmModalProps) {
  return (
    <ConfirmationModal
      open={open}
      title="Simpan dokumen penawaran?"
      subtitle="Konfirmasi pembuatan penawaran harga baru"
      description="Penawaran akan disimpan dengan status awal Draf dan status permintaan terkait berubah menjadi Sudah ditawarkan. Anda masih dapat meninjau dokumen sebelum mengirim ke WhatsApp customer."
      confirmLabel={isSubmitting ? "Menyimpan..." : "Ya, simpan penawaran"}
      variant="primary"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Nomor penawaran</span>
          <span className="font-mono font-bold text-slate-900">{quotationNumber}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Referensi permintaan</span>
          <span className="font-mono font-semibold text-[#19376d]">{requestCode}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Customer</span>
          <span className="font-semibold text-slate-800 truncate">{customerName || "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Jumlah item jasa</span>
          <span className="font-semibold text-slate-800">{itemsCount} layanan</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-200/80">
          <span className="font-semibold text-slate-700">Total penawaran</span>
          <span className="font-heading font-bold text-[#19376d]">{formatRupiah(totalAmount)}</span>
        </div>
      </div>
    </ConfirmationModal>
  );
}
