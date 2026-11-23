"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CreditCard,
  Eye,
  FileText,
  Receipt,
  Search,
  ShieldCheck,
  X,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { InvoiceFilterStatus, InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { formatDateId, normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";

export interface CustomerInvoiceListProps {
  invoices: InvoiceRecord[];
  filteredInvoices: InvoiceRecord[];
  searchTerm: string;
  statusFilter: InvoiceFilterStatus;
  payingInvoiceId: string | null;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: InvoiceFilterStatus) => void;
  onPayInvoice: (invoice: InvoiceRecord) => void;
}

/**
 * Tampilan daftar Invoice saya milik Customer login M1 (UC-07 / M4-US4-AC1).
 * Menggunakan kartu aksen kiri responsif Laptop & Tablet dan pemisah "|".
 */
export function CustomerInvoiceList({
  invoices,
  filteredInvoices,
  searchTerm,
  statusFilter,
  payingInvoiceId,
  onSearchChange,
  onStatusFilterChange,
  onPayInvoice,
}: CustomerInvoiceListProps) {
  const unpaidCount = invoices.filter((i) => normalizeInvoiceStatus(i.status) === "UNPAID").length;
  const paidCount = invoices.filter((i) => normalizeInvoiceStatus(i.status) === "PAID").length;

  const tabs: { value: InvoiceFilterStatus; label: string; count: number }[] = [
    { value: "ALL", label: "Semua", count: invoices.length },
    { value: "UNPAID", label: "Belum lunas", count: unpaidCount },
    { value: "PAID", label: "Lunas", count: paidCount },
  ];

  return (
    <div className="space-y-5">
      {/* 3 Kartu Metrik Ringkasan */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-slate-500">Total invoice</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {invoices.length}
              </span>
              <span className="text-xs text-slate-400">tagihan terdaftar</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#19376d] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-slate-500">Belum lunas</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {unpaidCount}
              </span>
              <span className="text-xs text-slate-400">menunggu pembayaran</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 @md:col-span-2 @2xl:col-span-1">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-slate-500">Lunas</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                {paidCount}
              </span>
              <span className="text-xs text-slate-400">pembayaran selesai</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Banner Informasi Pembayaran Aman Midtrans */}
      <div className="bg-[#eef4ff] border border-blue-200/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <div className="w-8 h-8 rounded-xl bg-[#19376d] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="font-bold text-slate-900">Pembayaran resmi terverifikasi otomatis</p>
          <p className="text-slate-600 leading-relaxed">
            Pilih tombol <strong>Bayar sekarang</strong> pada tagihan berstatus Belum lunas untuk
            menyelesaikan pembayaran melalui Midtrans Snap. Status invoice otomatis berubah menjadi
            Lunas setelah pembayaran berhasil.
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
            placeholder="Cari nomor invoice, layanan, atau partner..."
            aria-label="Cari invoice saya"
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f0f4fa] text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian invoice"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Daftar Kartu Invoice */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-xs text-center text-xs text-slate-500">
          Tidak ada invoice yang sesuai dengan pencarian atau filter Anda.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((inv) => {
            const isPaid = normalizeInvoiceStatus(inv.status) === "PAID";
            const isPaying = payingInvoiceId === inv.id;

            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 border-l-4 shadow-xs space-y-4 ${
                  isPaid ? "border-l-[#0e7490]" : "border-l-amber-500"
                }`}
              >
                <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-sm text-[#19376d]">
                      {inv.invoice_number}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 select-none">|</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0f4fa] text-slate-700 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-[#19376d]" />
                      <span>{inv.partner_name}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300 select-none hidden sm:inline">|</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#19376d] font-medium">
                      {inv.partner_category}
                    </span>
                  </div>
                  <InvoiceStatusBadge status={inv.status} />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-heading font-bold text-slate-900">
                    {inv.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {inv.items.length} item tagihan | Diterbitkan {formatDateId(inv.invoice_date)}
                  </p>
                </div>

                <div className="grid grid-cols-1 @md:grid-cols-3 gap-3 bg-[#f7f9fc] border border-slate-100 rounded-xl p-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Total tagihan</span>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base sm:text-lg font-heading font-bold text-[#19376d]">
                        {formatRupiah(inv.total_amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">(Termasuk PPN)</span>
                    </div>
                  </div>

                  <div className="space-y-1 @md:border-l @md:border-slate-200/80 @md:pl-4">
                    <span className="text-[11px] text-slate-500 block">
                      {isPaid ? "Tanggal lunas" : "Jatuh tempo"}
                    </span>
                    <div className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isPaid ? formatDateId(inv.paid_at) : formatDateId(inv.due_date)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 @md:border-l @md:border-slate-200/80 @md:pl-4">
                    <span className="text-[11px] text-slate-500 block">Referensi pesanan</span>
                    {inv.order_id ? (
                      <Link
                        href={`/order/lihat/${encodeURIComponent(inv.order_id)}`}
                        className="inline-flex items-center gap-1 font-mono font-bold text-[#0e7490] hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{inv.order_number || inv.order_id}</span>
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-600">-</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
                  <Link
                    href={`/invoice/lihat/${encodeURIComponent(inv.id)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat detail invoice</span>
                  </Link>

                  {!isPaid && (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={() => onPayInvoice(inv)}
                      className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isPaying ? "Membuka Midtrans..." : "Bayar sekarang"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
