"use client";

import React from "react";
import Link from "next/link";
import { Building2, Calendar, FileText, Receipt } from "lucide-react";
import { InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { formatDateId } from "@/lib/invoice-order-helpers";

export interface InvoiceDetailBodyProps {
  invoice: InvoiceRecord;
}

/**
 * Konten rincian dokumen invoice: informasi Partner, validitas dokumen,
 * tabel item tagihan, serta ringkasan subtotal, PPN, dan total.
 */
export function InvoiceDetailBody({ invoice }: InvoiceDetailBodyProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <span className="font-bold text-slate-900">Penyedia Jasa / Partner</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#19376d] text-[11px] font-semibold">
              {invoice.partner_category}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#19376d] text-white font-bold flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{invoice.partner_name}</p>
              <p className="text-slate-500">Mitra terverifikasi Araya Business Hub</p>
            </div>
          </div>
          <div className="bg-[#f7f9fc] rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-800">{invoice.customer_name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-700">{invoice.customer_email || "-"}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900">Informasi Dokumen</span>
            <span className="inline-flex items-center gap-1 text-[#19376d] font-semibold">
              <Receipt className="w-3.5 h-3.5" />
              <span>Resmi Terdaftar</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#f7f9fc] rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 block">Nomor invoice</span>
              <span className="font-mono font-bold text-[#19376d] text-sm">
                {invoice.invoice_number}
              </span>
            </div>
            <div className="bg-[#f7f9fc] rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 block">Pesanan terkait</span>
              {invoice.order_id ? (
                <Link
                  href={`/order/lihat/${encodeURIComponent(invoice.order_id)}`}
                  className="inline-flex items-center gap-1.5 font-mono font-bold text-[#0e7490] hover:underline text-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{invoice.order_number || invoice.order_id}</span>
                </Link>
              ) : (
                <span className="font-semibold text-slate-700">-</span>
              )}
            </div>
            <div className="bg-[#f7f9fc] rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 block">Tanggal penerbitan</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDateId(invoice.invoice_date)}</span>
              </span>
            </div>
            <div className="bg-amber-50/70 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 block">Jatuh tempo</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-900">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{formatDateId(invoice.due_date)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Rincian tagihan</h2>
          <span className="text-xs text-slate-500">{invoice.items.length} item</span>
        </div>
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-150 text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f4f7fb] text-slate-700 font-semibold border-b border-slate-200/70">
                <th className="px-5 py-3">Layanan / Produk</th>
                <th className="px-4 py-3 text-center">Satuan</th>
                <th className="px-4 py-3 text-center">Jumlah</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-600">{item.unit}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-700 whitespace-nowrap">
                    {formatRupiah(item.unit_price)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-[#f8fafc] border-t border-slate-100 flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{formatRupiah(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>PPN ({invoice.tax_rate}%)</span>
              <span className="font-semibold text-slate-800">{formatRupiah(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Total invoice</span>
              <span className="text-lg font-heading font-bold text-[#19376d]">
                {formatRupiah(invoice.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
