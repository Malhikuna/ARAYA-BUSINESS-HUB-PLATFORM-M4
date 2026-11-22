import { Quotation, QuotationFilterStatus } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo, getQuotationStatusLabel } from "@/lib/quotation-helpers";
import {
  MARGIN_X,
  COLOR_NAVY,
  COLOR_TEAL,
  COLOR_SLATE_900,
  COLOR_SLATE_700,
  COLOR_SLATE_500,
  buildTabularReportPdfBytes,
  triggerPdfDownload,
} from "@/lib/pdf-tabular-builder";

export interface QuotationListPdfOptions {
  quotations: Quotation[];
  drafCount: number;
  terkirimCount: number;
  disetujuiCount: number;
  statusFilter: QuotationFilterStatus;
  searchQuery: string;
  exportedAt?: Date;
}

export function downloadQuotationListPdf(options: QuotationListPdfOptions): void {
  const {
    quotations,
    drafCount,
    terkirimCount,
    disetujuiCount,
    statusFilter,
    searchQuery,
    exportedAt = new Date(),
  } = options;

  const statusLabel =
    statusFilter === "APPROVED"
      ? "Disetujui"
      : statusFilter === "DRAFT"
      ? "Draf"
      : statusFilter === "REJECTED"
      ? "Ditolak"
      : statusFilter === "SENT" || statusFilter === "PENDING_APPROVAL"
      ? "Terkirim"
      : "Semua status";

  const pdfBytes = buildTabularReportPdfBytes({
    subtitle: "Laporan Daftar Penawaran (Quotation) - Modul Penawaran & Tagihan Penjualan",
    filterSummaryLine: `Filter Status: ${statusLabel} | Cari: ${searchQuery.trim() ? `"${searchQuery.trim()}"` : "Semua"}`,
    exportedAt,
    summaryCards: [
      { title: "DRAF", value: `${drafCount} Draf`, accent: COLOR_NAVY },
      { title: "TERKIRIM", value: `${terkirimCount} Terkirim`, accent: COLOR_NAVY },
      { title: "DISETUJUI", value: `${disetujuiCount} Disetujui`, accent: COLOR_TEAL },
    ],
    columns: [
      { header: "Nomor", x: MARGIN_X, maxChars: 14, font: "F3", fontSize: 8, color: COLOR_SLATE_900 },
      { header: "Customer", x: MARGIN_X + 86, maxChars: 20, font: "F2", fontSize: 8, color: COLOR_SLATE_900 },
      { header: "Tanggal", x: MARGIN_X + 206, maxChars: 13, font: "F1", fontSize: 8, color: COLOR_SLATE_700 },
      { header: "Berlaku", x: MARGIN_X + 282, maxChars: 13, font: "F1", fontSize: 8, color: COLOR_SLATE_700 },
      { header: "Total", x: MARGIN_X + 358, maxChars: 16, font: "F2", fontSize: 8, color: COLOR_SLATE_900 },
      { header: "Status", x: MARGIN_X + 458, maxChars: 11, font: "F2", fontSize: 8, color: COLOR_SLATE_700 },
    ],
    rows: quotations.map((d) => [
      d.quotation_number,
      d.customer_name,
      formatTanggalIndo(d.quotation_date),
      d.valid_until ? formatTanggalIndo(d.valid_until) : "-",
      formatRupiah(d.total_amount),
      getQuotationStatusLabel(d.status),
    ]),
    emptyMessage: "Tidak ada data penawaran yang sesuai dengan filter.",
  });

  const dateSlug = exportedAt.toISOString().slice(0, 10);
  triggerPdfDownload(pdfBytes, `daftar-penawaran-araya-${dateSlug}.pdf`);
}

export function downloadQuotationDetailPdf(quotation: Quotation, exportedAt = new Date()): void {
  const pdfBytes = buildTabularReportPdfBytes({
    subtitle: `Penawaran Resmi ${quotation.quotation_number} - Araya Business Hub`,
    filterSummaryLine: `Pelanggan: ${quotation.customer_name} | Status: ${getQuotationStatusLabel(quotation.status)} | Tanggal: ${formatTanggalIndo(quotation.quotation_date)}`,
    exportedAt,
    summaryCards: [
      { title: "NOMOR DOKUMEN", value: quotation.quotation_number, accent: COLOR_NAVY },
      { title: "TOTAL ITEM JASA", value: `${quotation.items.length} Layanan`, accent: COLOR_NAVY },
      { title: "TOTAL PENAWARAN", value: formatRupiah(quotation.total_amount), accent: COLOR_TEAL },
    ],
    columns: [
      { header: "No", x: MARGIN_X, maxChars: 4, font: "F1", fontSize: 8, color: COLOR_SLATE_500 },
      { header: "Jasa / Layanan", x: MARGIN_X + 28, maxChars: 34, font: "F2", fontSize: 8, color: COLOR_SLATE_900 },
      { header: "Jumlah", x: MARGIN_X + 240, maxChars: 12, font: "F1", fontSize: 8, color: COLOR_SLATE_700 },
      { header: "Harga Satuan", x: MARGIN_X + 318, maxChars: 16, font: "F1", fontSize: 8, color: COLOR_SLATE_700 },
      { header: "Subtotal", x: MARGIN_X + 422, maxChars: 16, font: "F2", fontSize: 8, color: COLOR_SLATE_900 },
    ],
    rows: quotation.items.map((item, idx) => [
      String(idx + 1),
      item.description ? `${item.name} - ${item.description}` : item.name,
      `${item.quantity} ${item.unit || "Unit"}`,
      formatRupiah(item.unit_price),
      formatRupiah(item.subtotal),
    ]),
    emptyMessage: "Belum ada item jasa pada penawaran ini.",
  });

  const safeDoc = quotation.quotation_number.replace(/[^a-zA-Z0-9-_]/g, "-");
  triggerPdfDownload(pdfBytes, `penawaran-${safeDoc}.pdf`);
}
