"use client";

import React from "react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo, getQuotationStatusLabel } from "@/lib/data/mock-quotations";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export interface QuotationDeleteModalProps {
  quotation: Quotation | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal konfirmasi penghapusan dokumen penawaran harga.
 */
export function QuotationDeleteModal({
  quotation,
  onCancel,
  onConfirm,
}: QuotationDeleteModalProps) {
  return (
    <ConfirmationModal
      open={Boolean(quotation)}
      title="Hapus dokumen penawaran?"
      subtitle="Konfirmasi penghapusan penawaran harga"
      description="Apakah Anda yakin ingin menghapus penawaran ini? Dokumen yang telah dihapus tidak dapat dipulihkan dan tidak dapat dikonversi menjadi invoice."
      confirmLabel="Ya, hapus"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {quotation && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">
                {quotation.quotation_number}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {quotation.customer_name} • {formatTanggalIndo(quotation.quotation_date)}
              </div>
            </div>
            <div className="text-xs font-bold text-[#19376d] shrink-0 font-heading">
              {formatRupiah(quotation.total_amount)}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <span>Status dokumen:</span>
            <span className="font-semibold text-slate-800">
              {getQuotationStatusLabel(quotation.status)}
            </span>
          </div>
        </>
      )}
    </ConfirmationModal>
  );
}
