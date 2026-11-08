"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo } from "@/lib/data/mock-quotations";
import { Pagination } from "@/components/common/Pagination";

export interface QuotationTableProps {
  currentData: Quotation[];
  filteredCount: number;
  safeCurrentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

/**
 * Tabel daftar penawaran harga dengan status badge dan pagination.
 */
export function QuotationTable({
  currentData,
  filteredCount,
  safeCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
}: QuotationTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
              <th scope="col" className="px-6 py-3.5">Nomor</th>
              <th scope="col" className="px-6 py-3.5">Pelanggan</th>
              <th scope="col" className="px-6 py-3.5">Tanggal</th>
              <th scope="col" className="px-6 py-3.5">Total</th>
              <th scope="col" className="px-6 py-3.5">Status</th>
              <th scope="col" className="px-6 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.length > 0 ? (
              currentData.map((item) => {
                const isApproved = item.status === "APPROVED";
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
                    {/* Nomor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#19376d] group-hover:underline">
                          {item.quotation_number}
                        </span>
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#19376d]">
                            Baru
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pelanggan */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {item.customer_name}
                    </td>

                    {/* Tanggal */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatTanggalIndo(item.quotation_date)}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      {formatRupiah(item.total_amount)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e8f7fa] text-[#0e7490]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0e7490]" />
                          <span>Disetujui</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fef3eb] text-[#c25e1a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c25e1a]" />
                          <span>Menunggu persetujuan</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/penawaran/lihat/${item.id}`}
                        aria-label={`Lihat detail penawaran ${item.quotation_number}`}
                        className="font-semibold text-[#19376d] hover:underline"
                      >
                        Lihat
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
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
