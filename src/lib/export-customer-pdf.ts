import { Customer } from "@/types/customer";
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

export interface CustomerPdfExportOptions {
  customers: Customer[];
  totalRegistered: number;
  activeCustomers: number;
  selectedCity: string;
  searchTerm: string;
  exportedAt?: Date;
}

/**
 * Menghasilkan dokumen PDF 1.4 standar (A4 Portrait) berisi laporan daftar pelanggan.
 */
export function buildCustomerReportPdfBytes(
  options: CustomerPdfExportOptions
): Uint8Array {
  const {
    customers,
    totalRegistered,
    activeCustomers,
    selectedCity,
    searchTerm,
    exportedAt = new Date(),
  } = options;

  const filterCityLabel = selectedCity || "Semua kota";
  const filterSearchLabel = searchTerm.trim() ? `"${searchTerm.trim()}"` : "Semua";

  return buildTabularReportPdfBytes({
    subtitle:
      "Laporan Daftar Pelanggan - Modul Penawaran & Tagihan Penjualan (Sales)",
    filterSummaryLine: `Filter Kota: ${filterCityLabel} | Cari: ${filterSearchLabel}`,
    exportedAt,
    summaryCards: [
      {
        title: "TOTAL PELANGGAN TERDAFTAR",
        value: `${totalRegistered} Pelanggan`,
        accent: COLOR_NAVY,
      },
      {
        title: "PELANGGAN AKTIF",
        value: `${activeCustomers} Transaksi berjalan`,
        accent: COLOR_TEAL,
      },
      {
        title: "DATA TEREKSPOR (SESUAI FILTER)",
        value: `${customers.length} Data pelanggan`,
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
        header: "Nama Pelanggan",
        x: MARGIN_X + 28,
        maxChars: 22,
        font: "F2",
        fontSize: 8.5,
        color: COLOR_SLATE_900,
      },
      {
        header: "Telepon",
        x: MARGIN_X + 160,
        maxChars: 16,
        font: "F3",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
      {
        header: "Email",
        x: MARGIN_X + 254,
        maxChars: 24,
        font: "F1",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
      {
        header: "Alamat Lengkap",
        x: MARGIN_X + 382,
        maxChars: 26,
        font: "F1",
        fontSize: 8,
        color: COLOR_SLATE_700,
      },
    ],
    rows: customers.map((cust, idx) => [
      String(idx + 1),
      cust.name,
      cust.phone,
      cust.email || "-",
      cust.address || "-",
    ]),
    emptyMessage:
      "Tidak ada data pelanggan yang sesuai dengan filter pencarian.",
  });
}

export function downloadCustomerReportPdf(
  options: CustomerPdfExportOptions
): void {
  const pdfBytes = buildCustomerReportPdfBytes(options);
  const dateSlug = (options.exportedAt || new Date())
    .toISOString()
    .slice(0, 10);
  const citySlug =
    options.selectedCity && options.selectedCity !== "Semua kota"
      ? `-${options.selectedCity.toLowerCase().replace(/\s+/g, "-")}`
      : "";

  triggerPdfDownload(
    pdfBytes,
    `daftar-pelanggan-araya${citySlug}-${dateSlug}.pdf`
  );
}
