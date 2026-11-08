import React from "react";
import { ProductItem, BusinessMode } from "@/types/product";
import { ProductMetrics } from "@/components/produk/ProductMetricCards";
import { formatRupiah } from "@/lib/format";
import { ExportPdfPreviewModal } from "@/components/common/ExportPdfPreviewModal";

export interface ProductExportPdfModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
  filteredProducts: ProductItem[];
  metrics: ProductMetrics;
  businessMode: BusinessMode;
  selectedCategory: string;
  selectedStatus: string;
  searchTerm: string;
  previewDateLabel: string;
}

/**
 * Modal pratinjau dokumen laporan PDF katalog produk dan jasa sebelum diunduh.
 */
export function ProductExportPdfModal({
  open,
  onClose,
  onConfirmDownload,
  filteredProducts,
  metrics,
  businessMode,
  selectedCategory,
  selectedStatus,
  searchTerm,
  previewDateLabel,
}: ProductExportPdfModalProps) {
  return (
    <ExportPdfPreviewModal
      open={open}
      title="Pratinjau laporan PDF katalog"
      documentSubtitle="Laporan Katalog — Modul Penawaran & Tagihan Penjualan"
      printedAtLabel={previewDateLabel}
      filters={[
        { label: "Tipe Usaha", value: businessMode },
        { label: "Kategori", value: businessMode === "Semua" ? selectedCategory : businessMode },
        { label: "Status", value: selectedStatus },
        { label: "Cari", value: searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua" },
      ]}
      summaryCards={[
        { label: "Total Item Terdaftar", value: `${metrics.totalCount} Item katalog`, accent: "navy" },
        {
          label: "Item Katalog Aktif",
          value: `${metrics.totalCount - metrics.inactiveCount} Siap ditransaksikan`,
          accent: "teal",
        },
        {
          label: "Data Terekspor (Sesuai Filter)",
          value: `${filteredProducts.length} Item katalog`,
          accent: "navy",
          highlightValue: true,
        },
      ]}
      columns={[
        { header: "No", className: "w-9 text-slate-500" },
        { header: businessMode === "Jasa" ? "Nama Layanan Jasa" : "Nama & SKU", className: "font-bold text-slate-900" },
        { header: businessMode === "Jasa" ? "Satuan Layanan" : "Kategori / Stok", className: "text-slate-700 whitespace-nowrap" },
        { header: "Harga Acuan", align: "right", className: "font-bold text-slate-900 whitespace-nowrap" },
        { header: "Status", className: "text-slate-700 whitespace-nowrap" },
        { header: "Deskripsi", className: "text-slate-700" },
      ]}
      rows={filteredProducts.map((item, idx) => [
        idx + 1,
        <div key={item.id}>
          <div className="font-bold text-slate-900">{item.name}</div>
          {item.category === "Produk" && businessMode !== "Jasa" && (
            <div className="text-[10px] font-mono text-slate-500 font-normal">{item.sku}</div>
          )}
        </div>,
        item.category === "Produk"
          ? `Produk (${item.stock ?? 0} ${item.unit || "Unit"})`
          : `Jasa (Per ${item.unit || "Paket"})`,
        formatRupiah(item.price),
        item.status,
        item.description,
      ])}
      emptyMessage="Tidak ada data item katalog yang sesuai dengan filter pencarian."
      totalItems={filteredProducts.length}
      itemLabel="item katalog"
      onClose={onClose}
      onConfirmDownload={onConfirmDownload}
    />
  );
}

