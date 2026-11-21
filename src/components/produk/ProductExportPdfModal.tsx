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
  const isProductMode = businessMode === "Produk";
  const isServiceMode = businessMode === "Jasa";
  const itemUnitLabel = isProductMode ? "Produk" : isServiceMode ? "Jasa" : "Item katalog";

  const filters = [
    ...(businessMode === "Semua"
      ? [{ label: "Kategori", value: selectedCategory }]
      : [{ label: "Tipe Usaha", value: businessMode }]),
    { label: "Status", value: selectedStatus },
    { label: "Cari", value: searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua" },
  ];

  return (
    <ExportPdfPreviewModal
      open={open}
      title={
        isProductMode
          ? "Pratinjau laporan PDF katalog produk"
          : isServiceMode
          ? "Pratinjau laporan PDF katalog jasa"
          : "Pratinjau laporan PDF katalog"
      }
      documentSubtitle={
        isProductMode
          ? "Laporan Katalog Produk — Modul Penawaran & Tagihan Penjualan"
          : isServiceMode
          ? "Laporan Katalog Jasa — Modul Penawaran & Tagihan Penjualan"
          : "Laporan Katalog Produk & Jasa — Modul Penawaran & Tagihan Penjualan"
      }
      printedAtLabel={previewDateLabel}
      filters={filters}
      summaryCards={[
        {
          label: isProductMode ? "Total Produk Terdaftar" : isServiceMode ? "Total Jasa Terdaftar" : "Total Item Terdaftar",
          value: `${metrics.totalCount} ${itemUnitLabel}`,
          accent: "navy",
        },
        {
          label: isProductMode ? "Produk Aktif" : isServiceMode ? "Jasa Aktif" : "Item Katalog Aktif",
          value: `${metrics.totalCount - metrics.inactiveCount} ${isServiceMode ? "Siap ditawarkan" : "Siap ditransaksikan"}`,
          accent: "teal",
        },
        {
          label: "Data Terekspor (Sesuai Filter)",
          value: `${filteredProducts.length} ${itemUnitLabel}`,
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

