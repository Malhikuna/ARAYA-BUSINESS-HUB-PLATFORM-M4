"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Eye, Receipt, Search, X } from "lucide-react";
import { InvoiceFilterStatus, InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { formatDateId, normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";

export interface PartnerInvoiceTableProps {
  invoices: InvoiceRecord[];
  filteredInvoices: InvoiceRecord[];
  searchTerm: string;
  statusFilter: InvoiceFilterStatus;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: InvoiceFilterStatus) => void;
}

/**
 * Tabel daftar invoice untuk Partner (Partner Produk & Partner Jasa).
 */
export function PartnerInvoiceTable({
  invoices,
  filteredInvoices,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: PartnerInvoiceTableProps) {
  const router = useRouter();
  const unpaidCount = invoices.filter((i) => normalizeInvoiceStatus(i.status) === "UNPAID").length;
  const paidCount = invoices.filter((i) => normalizeInvoiceStatus(i.status) === "PAID").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500">Total invoice</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {invoices.length}
              </span>
              <span className="text-xs text-slate-400">dokumen</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#19376d] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500">Belum lunas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {unpaidCount}
              </span>
              <span className="text-xs text-slate-400">menunggu pelunasan</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 @md:col-span-2 @2xl:col-span-1">
          <div>
            <span className="text-xs font-medium text-slate-500">Lunas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {paidCount}
              </span>
              <span className="text-xs text-slate-400">terverifikasi Midtrans</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3">
        <div className="relative w-full @3xl:max-w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor invoice, customer, atau order..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#f0f4fa] rounded-xl overflow-x-auto custom-scrollbar">
          {(
            [
              { value: "ALL", label: "Semua" },
              { value: "UNPAID", label: "Belum lunas" },
              { value: "PAID", label: "Lunas" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-white text-[#19376d] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-200 text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70 whitespace-nowrap">
                <th scope="col" className="px-4 py-3.5">Nomor Invoice</th>
                <th scope="col" className="px-4 py-3.5">Customer</th>
                <th scope="col" className="px-4 py-3.5">Order Terkait</th>
                <th scope="col" className="px-4 py-3.5">Jatuh Tempo</th>
                <th scope="col" className="px-4 py-3.5">Total</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => router.push(`/invoice/lihat/${encodeURIComponent(inv.id)}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/invoice/lihat/${encodeURIComponent(inv.id)}`);
                      }
                    }}
                    className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-[#19376d] whitespace-nowrap group-hover:underline">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {inv.customer_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {inv.order_number || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDateId(inv.due_date)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <InvoiceStatusBadge status={inv.status} compact />
                    </td>
                    <td
                      className="px-4 py-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/invoice/lihat/${encodeURIComponent(inv.id)}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eef4ff] hover:bg-blue-100 text-[#19376d] font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada invoice yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
