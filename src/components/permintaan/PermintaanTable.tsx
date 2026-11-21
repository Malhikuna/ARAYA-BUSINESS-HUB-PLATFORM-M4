"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import { Pagination } from "@/components/common/Pagination";

export interface PermintaanTableProps {
  items: PermintaanItem[];
  totalFiltered: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Tabel Daftar Permintaan Jasa
 * Memiliki aksi CRUD (Edit & Delete) yang seragam dengan katalog Jasa & Produk,
 * klik baris tabel untuk melihat detail, dan mendukung pagination 10 item per halaman.
 */
export function PermintaanTable({
  items,
  totalFiltered,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}: PermintaanTableProps) {
  const router = useRouter();
  const startItem = totalFiltered === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalFiltered);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-220 sm:min-w-240 text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70 whitespace-nowrap">
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Nomor
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5 min-w-50">
                Nama permintaan
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Customer
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Nomor WhatsApp
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Jasa diminati
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Masuk
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3.5">
                Status
              </th>
              <th scope="col" className="w-16 px-3 sm:px-4 py-3.5 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                  Tidak ada permintaan jasa yang sesuai filter atau pencarian.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isNew = item.status === "Baru";
                const cleanWa = item.whatsapp.replace(/\D/g, "");
                const waUrl = cleanWa
                  ? `https://wa.me/${cleanWa.startsWith("0") ? `62${cleanWa.slice(1)}` : cleanWa}`
                  : null;

                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Lihat detail permintaan ${item.id}`}
                    title="Klik baris untuk melihat detail permintaan"
                    onClick={() => router.push(`/permintaan/lihat/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/permintaan/lihat/${item.id}`);
                      }
                    }}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* 1. Nomor */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900 text-xs">
                      {item.id}
                    </td>

                    {/* 2. Nama Permintaan */}
                    <td className="px-3 sm:px-4 py-3.5 min-w-50">
                      <span
                        className="font-bold text-slate-900 group-hover:text-[#19376d] transition-colors line-clamp-2 leading-snug block"
                        title={item.title}
                      >
                        {item.title}
                      </span>
                    </td>

                    {/* 3. Customer */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            item.customerAvatarBg || "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.customerInitials || "C"}
                        </div>
                        <span
                          className="font-semibold text-slate-800 whitespace-nowrap"
                          title={item.customerName}
                        >
                          {item.customerName}
                        </span>
                      </div>
                    </td>

                    {/* 4. Nomor WhatsApp */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-slate-700 hover:text-emerald-700 transition-colors"
                          title="Hubungi customer via WhatsApp"
                        >
                          {item.whatsapp}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-500">{item.whatsapp}</span>
                      )}
                    </td>

                    {/* 5. Jasa Diminati */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      <span
                        className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eef4ff] text-[#19376d] whitespace-nowrap"
                        title={item.serviceName}
                      >
                        {item.serviceName}
                      </span>
                    </td>

                    {/* 6. Masuk */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-800">{item.date}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.time}</div>
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      {isNew ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#d5f0f6] text-[#0f5368] whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0e7490]" />
                          <span>Baru</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Sudah ditawarkan</span>
                        </span>
                      )}
                    </td>

                    {/* 8. Aksi (Hanya Lihat Detail) */}
                    <td
                      className="w-16 px-3 sm:px-4 py-3.5 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/permintaan/lihat/${item.id}`);
                        }}
                        aria-label={`Lihat detail permintaan ${item.id}`}
                        title="Lihat detail rincian permintaan"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#19376d] hover:bg-[#eef4ff] transition-colors inline-flex items-center justify-center cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalFiltered}
        startIndex={startItem > 0 ? startItem - 1 : 0}
        endIndex={endItem}
        itemLabel="permintaan"
        onPageChange={onPageChange}
      />
    </div>
  );
}
