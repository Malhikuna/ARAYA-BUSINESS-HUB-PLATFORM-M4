import { ProductItem } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import {
  MARGIN_X,
  COLOR_NAVY,
  COLOR_TEAL,
  COLOR_SLATE_900,
  COLOR_SLATE_700,
  COLOR_SLATE_500,
  buildTabularReportPdfBytes,
  triggerPdfDownload,
  wrapColumnText,
} from "@/lib/pdf-tabular-builder";

export { wrapColumnText };

export interface ProductPdfExportOptions {
  products: ProductItem[];
  totalCount: number;
  activeCount: number;
  selectedCategory: string;
  selectedStatus: string;
  searchTerm: string;
  exportedAt?: Date;
}

/**
 * Menghasilkan dokumen PDF 1.4 standar (A4 Portrait) berisi laporan katalog produk & jasa.
 */
export function buildProductReportPdfBytes(
  options: ProductPdfExportOptions
): Uint8Array {
  const {
    products,
    totalCount,
    activeCount,
    selectedCategory,
    selectedStatus,
    searchTerm,
    exportedAt = new Date(),
  } = options;

  const filterSearchLabel = searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua";

  return buildTabularReportPdfBytes({
    subtitle:
      "Laporan Katalog Produk & Jasa - Modul Penawaran & Tagihan Penjualan",
    filterSummaryLine: `Kategori: ${selectedCategory} | Status: ${selectedStatus} | Cari: ${filterSearchLabel}`,
    exportedAt,
    summaryCards: [
      {
        title: "TOTAL PRODUK & JASA",
        value: `${totalCount} Item terdaftar`,
        accent: COLOR_NAVY,
      },
      {
        title: "ITEM KATALOG AKTIF",
        value: `${activeCount} Siap ditransaksikan`,
        accent: COLOR_TEAL,
      },
      {
        title: "DATA TEREKSPOR (SESUAI FILTER)",
        value: `${products.length} Item katalog`,
        accent: COLOR_NAVY,
      },
    ],
    columns: [
      {
        header: "No",
        x: MARGIN_X,
        maxChars: 4,
        font: "F1",
        fontSize: 8.5,
        color: COLOR_SLATE_500,
      },
      {
        header: "Nama & SKU",
        x: MARGIN_X + 26,
        maxChars: 24,
        font: "F2",
        fontSize: 8.5,
        color: COLOR_SLATE_900,
      },
      {
        header: "Kategori",
        x: MARGIN_X + 166,
        maxChars: 10,
        font: "F1",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
      {
        header: "Harga Acuan",
        x: MARGIN_X + 220,
        maxChars: 16,
        font: "F2",
        fontSize: 8,
        color: COLOR_SLATE_900,
      },
      {
        header: "Status",
        x: MARGIN_X + 312,
        maxChars: 10,
        font: "F1",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
      {
        header: "Deskripsi",
        x: MARGIN_X + 366,
        maxChars: 28,
        font: "F1",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
    ],
    rows: products.map((item, idx) => [
      String(idx + 1),
      `${item.name} (${item.sku})`,
      item.category,
      formatRupiah(item.price),
      item.status,
      item.description,
    ]),
    emptyMessage:
      "Tidak ada data produk atau jasa yang sesuai dengan filter pencarian.",
  });
}

export function downloadProductReportPdf(
  options: ProductPdfExportOptions
): void {
  const pdfBytes = buildProductReportPdfBytes(options);
  const dateSlug = (options.exportedAt || new Date())
    .toISOString()
    .slice(0, 10);
  triggerPdfDownload(pdfBytes, `katalog-produk-jasa-araya-${dateSlug}.pdf`);
}

