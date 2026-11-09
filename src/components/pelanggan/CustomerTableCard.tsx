"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  ShieldCheck,
  UserPlus,
  Download,
  Filter,
  Pencil,
  Trash2,
} from "lucide-react";
import { Customer } from "@/types/customer";
import { Pagination } from "@/components/common/Pagination";

export interface CustomerTableCardProps {
  totalCount: number;
  recentNewCount: number;
  newThisMonthCount: number;
  searchTerm: string;
  selectedCity: string;
  availableCities?: string[];
  currentData: Customer[];
  filteredCount: number;
  safeCurrentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSearchChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onOpenExportPreview: () => void;
  onRequestDelete: (customer: Customer) => void;
}

export function CustomerTableCard({
  totalCount,
  recentNewCount,
  newThisMonthCount,
  searchTerm,
  selectedCity,
  availableCities = [],
  currentData,
  filteredCount,
  safeCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  onSearchChange,
  onCityChange,
  onPageChange,
  onOpenExportPreview,
  onRequestDelete,
}: CustomerTableCardProps) {
  const router = useRouter();

  return (
    <>
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total pelanggan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400">Pelanggan terdaftar</span>
            {recentNewCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{recentNewCount} baru
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#19376d] h-full w-full rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pelanggan aktif</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">15</span>
            <span className="text-xs text-slate-400">Transaksi berjalan</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0e7490] h-full w-[83%] rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pelanggan baru</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{newThisMonthCount}</span>
            <span className="text-xs text-slate-400">Bulan ini</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#4f46e5] h-full w-[33%] rounded-full" />
          </div>
        </div>
      </div>

      {/* Filter Bar Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, kota, telepon, alamat..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d] transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="h-10 pl-8 pr-7 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-xs font-semibold text-slate-700 outline-none cursor-pointer transition-colors appearance-none"
            >
              <option value="Semua kota">Semua kota</option>
              {availableCities && availableCities.length > 0
                ? availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))
                : ["Bandung", "Jakarta", "Surabaya", "Semarang", "Yogyakarta"].map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="text-[10px] text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
          </div>

          <button
            type="button"
            onClick={onOpenExportPreview}
            title="Pratinjau & ekspor daftar pelanggan ke PDF"
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70">
                <th scope="col" className="w-[24%] px-4 sm:px-6 py-3.5">Nama</th>
                <th scope="col" className="w-[18%] px-4 sm:px-6 py-3.5">Telepon</th>
                <th scope="col" className="w-[22%] px-4 sm:px-6 py-3.5">Email</th>
                <th scope="col" className="w-[26%] px-4 sm:px-6 py-3.5">Alamat</th>
                <th scope="col" className="w-[10%] px-4 sm:px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length > 0 ? (
                currentData.map((cust) => (
                  <tr
                    key={cust.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Lihat detail pelanggan ${cust.name}`}
                    title="Klik baris untuk melihat detail pelanggan"
                    onClick={() => router.push(`/pelanggan/lihat/${cust.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/pelanggan/lihat/${cust.id}`);
                      }
                    }}
                    className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group"
                  >
                    <td className="px-4 sm:px-6 py-3.5 truncate">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${cust.avatarBg}`}>
                          {cust.initials}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-[#19376d] transition-colors text-xs truncate">
                          {cust.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 font-mono text-slate-600 truncate">{cust.phone}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-600 truncate">{cust.email}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-600 truncate" title={cust.address || ""}>{cust.address}</td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/pelanggan/ubah/${cust.id}`}
                          aria-label={`Ubah pelanggan ${cust.name}`}
                          title="Ubah pelanggan"
                          className="p-1.5 rounded-lg text-[#19376d] hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <span aria-hidden="true" className="text-slate-300 select-none text-xs">|</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(cust);
                          }}
                          aria-label={`Hapus pelanggan ${cust.name}`}
                          title="Hapus pelanggan"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada data pelanggan yang sesuai dengan pencarian.
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
          itemLabel="pelanggan"
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}

