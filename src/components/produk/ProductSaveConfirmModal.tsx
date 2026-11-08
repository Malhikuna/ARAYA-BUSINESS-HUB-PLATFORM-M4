import React from "react";
import { ProductFormValues } from "@/components/produk/ProductFormView";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export interface ProductSaveConfirmModalProps {
  open: boolean;
  isEdit: boolean;
  form: ProductFormValues;
  displaySku: string;
  previewPrice: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal konfirmasi penyimpanan penambahan atau pembaruan item katalog.
 */
export function ProductSaveConfirmModal({
  open,
  isEdit,
  form,
  displaySku,
  previewPrice,
  onConfirm,
  onCancel,
}: ProductSaveConfirmModalProps) {
  const isProduct = form.category === "Produk";

  return (
    <ConfirmationModal
      open={open}
      title={isEdit ? "Simpan perubahan item katalog?" : "Simpan item katalog baru?"}
      subtitle="Konfirmasi penyimpanan katalog"
      description="Item yang disimpan akan langsung aktif dan dapat dipilih saat menyusun dokumen penawaran maupun invoice."
      confirmLabel="Ya, simpan"
      variant="primary"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{form.name.trim()}</div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            {isProduct ? `${displaySku} | ` : ""}{form.category || "Item"} | {form.status}
            {isProduct
              ? ` | Stok: ${form.stock || "0"} ${form.unit || "Unit"}`
              : ` | Satuan: ${form.unit || "Paket"}`}
          </div>
        </div>
        <div className="text-xs font-heading font-bold text-[#19376d] shrink-0">{previewPrice}</div>
      </div>
    </ConfirmationModal>
  );
}

