import React from "react";
import { ProductItem } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export interface ProductDeleteModalProps {
  product: ProductItem | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal konfirmasi penghapusan item dari katalog produk atau jasa.
 */
export function ProductDeleteModal({
  product,
  onCancel,
  onConfirm,
}: ProductDeleteModalProps) {
  return (
    <ConfirmationModal
      open={Boolean(product)}
      title="Hapus item katalog?"
      subtitle="Konfirmasi penghapusan item dari katalog"
      description="Apakah Anda yakin ingin menghapus item ini? Item yang telah dihapus tidak akan tampil lagi pada pemilihan katalog di dokumen penawaran maupun invoice baru."
      confirmLabel="Ya, hapus"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {product && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{product.name}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {product.category === "Produk" ? `${product.sku} | ` : ""}{product.category} | {product.status}
              </div>
            </div>
            <div className="text-xs font-heading font-bold text-[#19376d] shrink-0">
              {formatRupiah(product.price)}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">
            {product.description}
          </div>
        </>
      )}
    </ConfirmationModal>
  );
}

