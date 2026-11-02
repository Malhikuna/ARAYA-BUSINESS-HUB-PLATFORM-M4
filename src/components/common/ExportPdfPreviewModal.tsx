"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface PdfFilterItem {
  label: string;
  value: string;
}

export interface PdfSummaryCardItem {
  label: string;
  value: string;
  accent?: "navy" | "teal";
  highlightValue?: boolean;
}

export interface PdfTableColumn {
  header: string;
  align?: "left" | "right";
  className?: string;
}

export interface ExportPdfPreviewModalProps {
  open: boolean;
  title: string;
  documentSubtitle: string;
  printedAtLabel: string;
  filters: PdfFilterItem[];
  summaryCards: PdfSummaryCardItem[];
  columns: PdfTableColumn[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
  totalItems: number;
  itemLabel: string;
  rowsPerPage?: number;
  onClose: () => void;
  onConfirmDownload: () => void;
}

export function ExportPdfPreviewModal({
  open,
  title,
  documentSubtitle,
  printedAtLabel,
  filters,
  summaryCards,
  columns,
  rows,
  emptyMessage = "Tidak ada data yang sesuai dengan filter pencarian.",
  totalItems,
  itemLabel,
  rowsPerPage = 12,
  onClose,
  onConfirmDownload,
}: ExportPdfPreviewModalProps) {
  const [previewPage, setPreviewPage] = useState(1);

  const totalPreviewPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const safePage = Math.min(previewPage, totalPreviewPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageRows = rows.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") setPreviewPage((prev) => Math.max(1, Math.min(prev, totalPreviewPages) - 1));
      else if (event.key === "ArrowRight") setPreviewPage((prev) => Math.min(totalPreviewPages, Math.min(prev, totalPreviewPages) + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, totalPreviewPages]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-[1px] animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-pdf-preview-title"
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Pratinjau */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef4ff] border border-blue-200/70 flex items-center justify-center shrink-0">
              <FileText aria-hidden="true" className="w-5 h-5 text-[#19376d]" />
            </div>
            <div>
              <h2 id="export-pdf-preview-title" className="text-base font-heading font-bold text-slate-900">
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa tampilan dokumen per halaman sebelum mengunduh file PDF (A4 Portrait)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau PDF"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Area Kertas A4 Pratinjau Dokumen (Per Lembar Halaman) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200/75 p-4 sm:p-6">
          <div className="bg-white max-w-205 mx-auto rounded-sm shadow-md border border-slate-300 p-5 sm:px-7 sm:py-6 flex flex-col justify-between min-h-145 space-y-5 text-slate-800">
            <div className="space-y-5">
              {/* Kop Dokumen Araya Business Hub */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-2 border-[#19376d]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-[#19376d] text-white font-heading font-bold text-base flex items-center justify-center shrink-0">
                    A
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-heading font-bold text-slate-900 tracking-wide whitespace-nowrap">
                      ARAYA BUSINESS HUB
                    </div>
                    <div className="text-[10.5px] text-slate-500 whitespace-nowrap">{documentSubtitle}</div>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-600 sm:text-right space-y-0.5 shrink-0">
                  <div className="whitespace-nowrap">
                    <span className="font-semibold text-slate-700">Dicetak:</span> {printedAtLabel}
                  </div>
                  <div className="whitespace-nowrap">
                    {filters.map((filter, idx) => (
                      <React.Fragment key={filter.label}>
                        {idx > 0 && <span aria-hidden="true" className="mx-1.5 text-slate-400">|</span>}
                        <span className="font-semibold text-slate-700">{filter.label}:</span> <span>{filter.value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kotak Ringkasan Metrik (Hanya di Halaman 1 seperti dokumen PDF asli) */}
              {safePage === 1 && summaryCards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      className={`bg-slate-50 border border-slate-200 rounded-md p-3 border-t-2 ${
                        card.accent === "teal" ? "border-t-[#0e7490]" : "border-t-[#19376d]"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</div>
                      <div className={`text-sm font-heading font-bold mt-1 ${card.highlightValue ? "text-[#19376d]" : "text-slate-900"}`}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabel Dokumen PDF (Halaman Aktif) */}
              <div className="border border-slate-300 rounded-xs overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#19376d] text-white font-semibold">
                      {columns.map((col) => (
                        <th
                          key={col.header}
                          className={`py-2 px-2.5 text-white font-semibold ${col.align === "right" ? "text-right" : "text-left"}`}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pageRows.length > 0 ? (
                      pageRows.map((cells, rowIdx) => (
                        <tr key={startIndex + rowIdx} className={rowIdx % 2 === 1 ? "bg-slate-50/90" : "bg-white"}>
                          {cells.map((cell, cellIdx) => {
                            const col = columns[cellIdx];
                            return (
                              <td
                                key={cellIdx}
                                className={`py-2 px-2.5 align-top ${col?.align === "right" ? "text-right" : "text-left"} ${col?.className || ""}`}
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="py-6 text-center text-slate-400">
                          {emptyMessage}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Kertas A4 */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>Dokumen dihasilkan otomatis oleh Araya Business Hub Platform (Modul 4 Sales)</span>
              <span className="font-semibold text-slate-600">Halaman {safePage} dari {totalPreviewPages}</span>
            </div>
          </div>
        </div>

        {/* Footer Aksi & Navigasi Halaman Modal Pratinjau */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-slate-500">
              Total <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel} siap diunduh (
              <span className="font-semibold text-slate-700">{totalPreviewPages} halaman A4</span>)
            </div>

            {totalPreviewPages > 1 && (
              <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setPreviewPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  aria-label="Halaman pratinjau sebelumnya"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 text-[11px] font-semibold text-slate-700 select-none">
                  Hal. {safePage} / {totalPreviewPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPage(Math.min(totalPreviewPages, safePage + 1))}
                  disabled={safePage >= totalPreviewPages}
                  aria-label="Halaman pratinjau berikutnya"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirmDownload}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
