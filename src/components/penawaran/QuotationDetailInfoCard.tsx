"use client";

import React, { useState } from "react";
import { Copy, Check, Calendar, Info } from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo, hitungMasaBerlaku } from "@/lib/data/mock-quotations";

export interface QuotationDetailInfoCardProps {
  quotation: Quotation;
}

/**
 * Card Informasi Penawaran dan Tabel Rincian Item Penawaran.
 */
export function QuotationDetailInfoCard({ quotation }: QuotationDetailInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const isApproved = quotation.status === "APPROVED";
  const { labelMasaBerlaku } = hitungMasaBerlaku(quotation.quotation_date, quotation.valid_until);

  // Initials pelanggan untuk avatar
  const initials = quotation.customer_name
    .replace(/^(PT|CV|UD)\s+/i, "")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(quotation.quotation_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Card Informasi Penawaran */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Informasi penawaran</h2>
          <span className="text-xs text-slate-400 font-mono">
            ID Dokumen: #{quotation.doc_id || "DOC-88219"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs">
          {/* Pelanggan */}
          <div className="space-y-1.5">
            <span className="text-slate-400 block text-[11px] font-medium">Pelanggan</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eef4ff] text-[#19376d] font-bold flex items-center justify-center shrink-0 text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate text-xs">
                  {quotation.customer_name}
                </span>
                <span className="text-slate-500 text-[11px] block truncate">
                  {quotation.customer_email || "procurement@majubersama.co.id"}
                </span>
              </div>
            </div>
          </div>

          {/* Nomor Penawaran */}
          <div className="space-y-1.5">
            <span className="text-slate-400 block text-[11px] font-medium">Nomor penawaran</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {quotation.quotation_number}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                title="Salin nomor penawaran"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <span className="text-slate-400 block text-[11px] font-medium">Tanggal</span>
            <span className="font-medium text-slate-800 text-xs block">
              {formatTanggalIndo(quotation.quotation_date)}
            </span>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <span className="text-slate-400 block text-[11px] font-medium">Status</span>
            <div>
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
            </div>
          </div>

          {/* Masa Berlaku */}
          <div className="sm:col-span-2 space-y-1.5 pt-1">
            <span className="text-slate-400 block text-[11px] font-medium">Masa berlaku</span>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-xs">
                {labelMasaBerlaku}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card Item Penawaran */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Item penawaran</h2>
          <span className="text-xs text-slate-400">
            {quotation.items.length} rincian layanan
          </span>
        </div>

        <div className="w-full overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/80">
                <th scope="col" className="w-[45%] px-4 py-3 rounded-l-lg">Produk/jasa</th>
                <th scope="col" className="w-[15%] px-4 py-3 text-center">Jumlah</th>
                <th scope="col" className="w-[20%] px-4 py-3 text-right">Harga satuan</th>
                <th scope="col" className="w-[20%] px-4 py-3 text-right rounded-r-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 block text-xs">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatRupiah(item.unit_price)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box Kalkulasi Subtotal & Total */}
        <div className="pt-2 flex justify-end">
          <div className="bg-[#f4f7fc] rounded-2xl p-4 sm:p-5 w-full sm:w-80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatRupiah(quotation.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 pb-2">
              <span>Pajak (PPN 0%)</span>
              <span className="font-semibold text-slate-800">Rp 0</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
              <span className="font-bold text-slate-900 text-sm">Total</span>
              <span className="text-xl font-heading font-bold text-[#19376d]">
                {formatRupiah(quotation.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note Bawah */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Setujui penawaran setelah Customer menyatakan setuju.</span>
      </div>
    </div>
  );
}

