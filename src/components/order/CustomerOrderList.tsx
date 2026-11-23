"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { OrderFilterStatus, OrderRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { normalizeInvoiceStatus, normalizeOrderStatus } from "@/lib/invoice-order-helpers";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { OrderProgressStepper, OrderStatusBadge } from "@/components/order/OrderProgressStepper";

export interface CustomerOrderListProps {
  orders: OrderRecord[];
  filteredOrders: OrderRecord[];
  searchTerm: string;
  statusFilter: OrderFilterStatus;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: OrderFilterStatus) => void;
}

/**
 * Tampilan Pesanan saya milik Customer login M1 (UC-09 / M4-US5-AC3).
 * Berbasis akun terautentikasi tanpa fitur Guest Tracking (BR-10 & BR-12).
 */
export function CustomerOrderList({
  orders,
  filteredOrders,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: CustomerOrderListProps) {
  const baruCount = orders.filter((o) => normalizeOrderStatus(o.status) === "baru").length;
  const diprosesCount = orders.filter((o) => normalizeOrderStatus(o.status) === "diproses").length;
  const selesaiCount = orders.filter((o) => normalizeOrderStatus(o.status) === "selesai").length;

  const tabs: { value: OrderFilterStatus; label: string; count: number }[] = [
    { value: "ALL", label: "Semua", count: orders.length },
    { value: "baru", label: "Baru", count: baruCount },
    { value: "diproses", label: "Diproses", count: diprosesCount },
    { value: "selesai", label: "Selesai", count: selesaiCount },
  ];

  return (
    <div className="space-y-5">
      {/* 3 Kartu Metrik */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Total pesanan</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {orders.length}
              </span>
              <span className="text-xs text-slate-400">pesanan aktif & riwayat</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#19376d] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Sedang diproses</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {diprosesCount}
              </span>
              <span className="text-xs text-slate-400">dikerjakan partner</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0e7490] flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 @md:col-span-2 @2xl:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Selesai</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {selesaiCount}
              </span>
              <span className="text-xs text-slate-400">pesanan tuntas</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Info Akses Berbasis Akun (BR-10 / BR-12: Tanpa Guest Tracking) */}
      <div className="bg-[#eef4ff] border border-blue-200/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <div className="w-8 h-8 rounded-xl bg-[#19376d] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="font-bold text-slate-900">Pemantauan pesanan pribadi berbasis akun M1</p>
          <p className="text-slate-600 leading-relaxed">
            Seluruh pesanan di bawah ini terhubung langsung ke akun Anda (BR-10). Progres diperbarui
            secara real-time oleh Partner mulai dari <strong>Baru</strong>,{" "}
            <strong>Diproses</strong>, hingga <strong>Selesai</strong>.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#f0f4fa] rounded-xl overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusFilterChange(tab.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active ? "bg-[#19376d] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full @3xl:max-w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor pesanan, layanan, atau partner..."
            aria-label="Cari pesanan saya"
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian pesanan"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Daftar Kartu Pesanan */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-xs text-center text-xs text-slate-500">
          Tidak ada pesanan yang sesuai dengan pencarian atau filter Anda.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const canonical = normalizeOrderStatus(ord.status);
            const isInvoicePaid = normalizeInvoiceStatus(ord.invoice_status) === "PAID";

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 border-l-4 shadow-xs space-y-4 ${
                  canonical === "selesai"
                    ? "border-l-emerald-600"
                    : canonical === "diproses"
                    ? "border-l-[#0e7490]"
                    : "border-l-[#19376d]"
                }`}
              >
                <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-sm text-[#19376d]">
                      {ord.order_number}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 select-none">|</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0f4fa] text-slate-700 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-[#19376d]" />
                      <span>{ord.partner_name}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300 select-none hidden sm:inline">|</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#19376d] font-medium">
                      {ord.partner_category}
                    </span>
                  </div>
                  <OrderStatusBadge status={ord.status} />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-heading font-bold text-slate-900">
                    {ord.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800">{formatRupiah(ord.total_amount)}</span>
                    <span aria-hidden="true" className="text-slate-300 select-none">|</span>
                    <span>Invoice {ord.invoice_number}</span>
                    <InvoiceStatusBadge status={ord.invoice_status} compact />
                  </div>
                </div>

                {/* Komponen Progres Eksisting (PRO-67) */}
                <OrderProgressStepper
                  currentStatus={ord.status}
                  statusUpdatedAt={ord.status_updated_at}
                  timeline={ord.timeline}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-1">
                  {!isInvoicePaid && (
                    <Link
                      href={`/invoice/lihat/${encodeURIComponent(ord.invoice_id)}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                      <span>Bayar invoice {ord.invoice_number}</span>
                    </Link>
                  )}

                  <Link
                    href={`/order/lihat/${encodeURIComponent(ord.id)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Lihat detail pesanan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
