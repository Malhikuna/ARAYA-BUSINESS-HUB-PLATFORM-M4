"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Lock,
  Package,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { OrderFilterStatus, OrderRecord, OrderStatus } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import {
  evaluateOrderProcessGuard,
  formatDateTimeWib,
  normalizeOrderStatus,
} from "@/lib/invoice-order-helpers";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { OrderStatusBadge } from "@/components/order/OrderProgressStepper";

export interface PartnerOrderTableProps {
  orders: OrderRecord[];
  filteredOrders: OrderRecord[];
  searchTerm: string;
  statusFilter: OrderFilterStatus;
  updatingOrderId: string | null;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: OrderFilterStatus) => void;
  onRequestStatusChange: (order: OrderRecord, nextStatus: OrderStatus) => void;
}

/**
 * Tabel Order Partner (UC-08 / PRO-66) dengan penegakan Guard U-01 & BR-09:
 * Tombol ubah status ke Diproses dinonaktifkan dengan keterangan jelas bila Invoice belum Lunas.
 */
export function PartnerOrderTable({
  orders,
  filteredOrders,
  searchTerm,
  statusFilter,
  updatingOrderId,
  onSearchChange,
  onStatusFilterChange,
  onRequestStatusChange,
}: PartnerOrderTableProps) {
  const router = useRouter();
  const baruCount = orders.filter((o) => normalizeOrderStatus(o.status) === "baru").length;
  const diprosesCount = orders.filter((o) => normalizeOrderStatus(o.status) === "diproses").length;
  const selesaiCount = orders.filter((o) => normalizeOrderStatus(o.status) === "selesai").length;

  return (
    <div className="space-y-5">
      {/* 3 Metrik */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500">Order baru</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {baruCount}
              </span>
              <span className="text-xs text-slate-400">menunggu diproses</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500">Diproses</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {diprosesCount}
              </span>
              <span className="text-xs text-slate-400">sedang dikerjakan</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#19376d] flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 @md:col-span-2 @2xl:col-span-1">
          <div>
            <span className="text-xs font-medium text-slate-500">Selesai</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {selesaiCount}
              </span>
              <span className="text-xs text-slate-400">final (BR-09)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Info Aturan U-01 */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Aturan U-01 aktif:</strong> Order berstatus <strong>Baru</strong> hanya dapat
          diubah menjadi <strong>Diproses</strong> apabila Invoice terkait sudah berstatus{" "}
          <strong>Lunas</strong>. Order berstatus <strong>Selesai</strong> bersifat final (BR-09).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3">
        <div className="relative w-full @3xl:max-w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor order, invoice, atau customer..."
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
              { value: "baru", label: "Baru" },
              { value: "diproses", label: "Diproses" },
              { value: "selesai", label: "Selesai" },
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

      {/* Tabel Order Partner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-230 text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/70 whitespace-nowrap">
                <th scope="col" className="px-4 py-3.5">Nomor Order</th>
                <th scope="col" className="px-4 py-3.5">Customer</th>
                <th scope="col" className="px-4 py-3.5">Invoice & Pembayaran</th>
                <th scope="col" className="px-4 py-3.5">Total</th>
                <th scope="col" className="px-4 py-3.5">Status Order</th>
                <th scope="col" className="px-4 py-3.5 text-right">Aksi Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const guard = evaluateOrderProcessGuard(ord);
                  const isBusy = updatingOrderId === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => router.push(`/order/lihat/${encodeURIComponent(ord.id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/order/lihat/${encodeURIComponent(ord.id)}`);
                        }
                      }}
                      className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group align-top"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#19376d] group-hover:underline">
                          {ord.order_number}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 max-w-52 truncate">
                          {ord.title}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {ord.customer_name}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-700">
                            {ord.invoice_number}
                          </span>
                          <InvoiceStatusBadge status={ord.invoice_status} compact />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(ord.total_amount)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <OrderStatusBadge status={ord.status} compact />
                        <div className="text-[11px] text-slate-400 mt-1">
                          {formatDateTimeWib(ord.status_updated_at)}
                        </div>
                      </td>

                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex flex-col items-end gap-1">
                          {guard.isFinal ? (
                            <span
                              title={guard.reason || undefined}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Final (Selesai)</span>
                            </span>
                          ) : guard.blockedByUnpaidInvoice ? (
                            <>
                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                title={guard.reason || undefined}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-semibold cursor-not-allowed opacity-75"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Proses order</span>
                              </button>
                              <span className="text-[10px] font-semibold text-amber-700">
                                Invoice belum lunas (U-01)
                              </span>
                            </>
                          ) : guard.canProcess ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onRequestStatusChange(ord, "diproses")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#19376d] hover:bg-[#122852] disabled:opacity-60 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>{isBusy ? "Memproses..." : "Proses order"}</span>
                            </button>
                          ) : guard.canComplete ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onRequestStatusChange(ord, "selesai")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0e7490] hover:bg-[#0c6077] disabled:opacity-60 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isBusy ? "Menyimpan..." : "Selesaikan order"}</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada data order yang sesuai dengan pencarian atau filter.
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
