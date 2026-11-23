"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CheckCircle2, Eye } from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  formatTanggalIndo,
  derivePermintaanIdFromQuotationNumber,
  normalizeQuotationStatus,
} from "@/lib/data/mock-quotations";
import { formatRequestDisplayCode } from "@/lib/data/quotation-workflow-api";
import { Pagination } from "@/components/common/Pagination";

export interface QuotationTableProps {
  currentData: Quotation[];
  filteredCount: number;
  safeCurrentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  isCustomer?: boolean;
  onPageChange: (page: number) => void;
  onRequestEdit?: (item: Quotation) => void;
  onRequestDelete?: (item: Quotation) => void;
}

/**
 * Tabel daftar penawaran harga dengan scroll horizontal responsif,
 * nomor permintaan yang terhubung, dan aksi adaptif (Partner Jasa vs Customer M1).
 */
export function QuotationTable({
  currentData,
  filteredCount,
  safeCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  isCustomer = false,
  onPageChange,
  onRequestEdit,
  onRequestDelete,
}: QuotationTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-240 text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70 whitespace-nowrap">
              <th scope="col" className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Nomor</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 min-w-50 whitespace-nowrap">Permintaan</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 min-w-40 whitespace-nowrap">Customer</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Tanggal</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Berlaku sampai</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Total</th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Status</th>
              <th scope="col" className="w-28 px-3 sm:px-4 py-3.5 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.length > 0 ? (
              currentData.map((item) => {
                const canonicalStatus = normalizeQuotationStatus(item.status);
                const isApproved = canonicalStatus === "APPROVED";
                const isDraft = canonicalStatus === "DRAFT";
                const isRejected = canonicalStatus === "REJECTED";

                // Resolusi nomor permintaan melalui helper terpusat (UUID tampil ringkas SR-XXXXXXXX)
                const rawPmtId =
                  item.service_request_id ||
                  item.permintaan_id ||
                  derivePermintaanIdFromQuotationNumber(item.quotation_number);
                const derivedPmtId = rawPmtId ? formatRequestDisplayCode(rawPmtId) : undefined;
                const pmtTitle =
                  item.permintaan_title || item.notes || "Layanan konsultasi & jasa";

                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Lihat detail penawaran ${item.quotation_number}`}
                    title="Klik baris untuk melihat detail penawaran"
                    onClick={() => router.push(`/penawaran/lihat/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/penawaran/lihat/${item.id}`);
                      }
                    }}
                    className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group"
                  >
                    {/* 1. Nomor Penawaran */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#19376d] group-hover:underline">
                          {item.quotation_number}
                        </span>
                        {item.isNew && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#19376d]">
                            Baru
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Permintaan Terhubung */}
                    <td className="px-3 sm:px-4 py-3.5 text-slate-700 min-w-50">
                      {derivedPmtId ? (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-[#19376d] font-mono">{derivedPmtId}</span>
                          <span className="text-slate-400 select-none">|</span>
                          <span className="text-slate-600 font-normal">{pmtTitle}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 3. Customer */}
                    <td className="px-3 sm:px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap" title={item.customer_name}>
                      {item.customer_name}
                    </td>

                    {/* 4. Tanggal Penawaran */}
                    <td className="px-3 sm:px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatTanggalIndo(item.quotation_date)}
                    </td>

                    {/* 5. Berlaku Sampai */}
                    <td className="px-3 sm:px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {item.valid_until ? formatTanggalIndo(item.valid_until) : "-"}
                    </td>

                    {/* 6. Total Nilai */}
                    <td className="px-3 sm:px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(item.total_amount)}
                    </td>

                    {/* 7. Status (Draf=Abu-abu, Terkirim=Kuning, Disetujui=Hijau, Ditolak=Merah) */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Disetujui</span>
                        </span>
                      ) : isDraft ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          <span>Draf</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Ditolak</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Terkirim</span>
                        </span>
                      )}
                    </td>

                    {/* 8. Aksi (Customer M1: Tinjau & Setujui / Lihat; Partner: Ubah & Hapus) */}
                    <td
                      className="w-36 px-3 sm:px-4 py-3.5 whitespace-nowrap text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isCustomer ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/penawaran/lihat/${item.id}`);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            canonicalStatus === "SENT"
                              ? "bg-[#19376d] hover:bg-[#122852] text-white shadow-2xs"
                              : "bg-[#eef4ff] hover:bg-blue-100 text-[#19376d]"
                          }`}
                        >
                          {canonicalStatus === "SENT" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tinjau & Setujui</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat detail</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1.5 shrink-0">
                        {isDraft ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestEdit?.(item);
                              }}
                              aria-label={`Ubah penawaran ${item.quotation_number}`}
                              title="Ubah dokumen penawaran draf"
                              className="p-1.5 rounded-lg text-[#19376d] hover:bg-blue-50 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                              suppressHydrationWarning
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span aria-hidden="true" className="text-slate-300 select-none text-xs">
                              |
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDelete?.(item);
                              }}
                              aria-label={`Hapus penawaran ${item.quotation_number}`}
                              title="Hapus dokumen penawaran draf"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                              suppressHydrationWarning
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isApproved ? (
                          <>
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              title="Penawaran sudah disetujui dan terkunci total (Read-Only)"
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed inline-flex items-center justify-center shrink-0"
                              suppressHydrationWarning
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span aria-hidden="true" className="text-slate-200 select-none text-xs">
                              |
                            </span>
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              title="Penawaran yang telah disetujui tidak dapat dihapus"
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed inline-flex items-center justify-center shrink-0"
                              suppressHydrationWarning
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              title={
                                isRejected
                                  ? "Penawaran berstatus ditolak tidak dapat diubah"
                                  : "Penawaran berstatus terkirim (menunggu persetujuan customer, rincian terkunci)"
                              }
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed inline-flex items-center justify-center shrink-0"
                              suppressHydrationWarning
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span aria-hidden="true" className="text-slate-200 select-none text-xs">
                              |
                            </span>
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              title={
                                isRejected
                                  ? "Penawaran berstatus ditolak tidak dapat dihapus"
                                  : "Penawaran berstatus terkirim tidak dapat dihapus"
                              }
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed inline-flex items-center justify-center shrink-0"
                              suppressHydrationWarning
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-xs">
                  Tidak ada data penawaran yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={filteredCount}
        startIndex={startIndex}
        endIndex={endIndex}
        itemLabel="penawaran"
        onPageChange={onPageChange}
      />
    </div>
  );
}
