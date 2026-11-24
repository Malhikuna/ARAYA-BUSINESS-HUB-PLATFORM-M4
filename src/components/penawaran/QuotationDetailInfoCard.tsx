"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Calendar,
  Info,
  ClipboardList,
  MessageCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import {
  formatTanggalIndo,
  hitungMasaBerlaku,
  derivePermintaanIdFromQuotationNumber,
  normalizeQuotationStatus,
} from "@/lib/data/mock-quotations";
import { findPermintaanById } from "@/lib/data/mock-permintaan";
import { buildWhatsAppUrl } from "@/components/permintaan/whatsapp-url";

export interface QuotationDetailInfoCardProps {
  quotation: Quotation;
}

/**
 * Card Informasi Penawaran dan Item Penawaran.
 */
export function QuotationDetailInfoCard({ quotation }: QuotationDetailInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const { labelMasaBerlaku } = hitungMasaBerlaku(quotation.quotation_date, quotation.valid_until);
  const permintaan = quotation.permintaan_id ? findPermintaanById(quotation.permintaan_id) : null;

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

  const canonicalStatus = normalizeQuotationStatus(quotation.status);
  const isDraft = canonicalStatus === "DRAFT";
  const isApproved = canonicalStatus === "APPROVED";
  const isSent = canonicalStatus === "SENT";
  const isRejected = canonicalStatus === "REJECTED";

  const phoneDisplay = quotation.customer_phone || permintaan?.whatsapp || "";
  const waUrl = buildWhatsAppUrl(phoneDisplay);
  const derivedPmtId =
    quotation.permintaan_id || derivePermintaanIdFromQuotationNumber(quotation.quotation_number);

  return (
    <div className="space-y-6">
      {/* 1. Card: Informasi Penawaran */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          Informasi penawaran
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-xs">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            {/* Pelanggan */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Pelanggan</span>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    permintaan?.customerAvatarBg || "bg-blue-100 text-blue-700"
                  }`}
                >
                  {permintaan?.customerInitials || initials}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {quotation.customer_name}
                  </div>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 text-xs font-mono transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{phoneDisplay}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Nomor WhatsApp belum tersedia</span>
                  )}
                </div>
              </div>
            </div>

            {/* Asal Permintaan */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Asal permintaan</span>
              <div>
                {derivedPmtId ? (
                  <Link
                    href={`/permintaan/lihat/${derivedPmtId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#eef4ff] hover:bg-[#dbeafe] text-[#19376d] border border-blue-200 transition-colors shadow-2xs group"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-[#19376d]" />
                    <span>Permintaan {derivedPmtId}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#19376d] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Tanggal</span>
              <div className="text-slate-900 font-semibold text-xs sm:text-sm">
                {formatTanggalIndo(quotation.quotation_date)}
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            {/* Nomor Penawaran */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Nomor penawaran</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm font-mono">
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

            {/* Status */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Status</span>
              <div>
                {isDraft ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Draf</span>
                  </span>
                ) : isSent ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Terkirim</span>
                  </span>
                ) : isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Disetujui</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Ditolak</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Masa Berlaku */}
            <div className="space-y-1.5">
              <span className="text-slate-400 block text-[11px] font-medium">Masa berlaku</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{quotation.valid_until ? labelMasaBerlaku : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card: Item Penawaran */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-900">Item penawaran</h2>
          <span className="text-xs text-slate-400 font-medium">
            {quotation.items.length} rincian layanan
          </span>
        </div>

        {/* Tabel Layanan */}
        <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-100">
          <table className="w-full min-w-140 sm:min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] text-slate-700 font-semibold border-b border-slate-200/80">
                <th scope="col" className="px-4 py-3">Jasa / Layanan</th>
                <th scope="col" className="px-3 py-3 text-center w-28">Satuan</th>
                <th scope="col" className="px-3 py-3 text-center w-20">Jumlah</th>
                <th scope="col" className="px-4 py-3 text-right">Harga satuan</th>
                <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 block leading-snug">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center text-slate-600">
                    {item.unit || "per bulan"}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold text-slate-900">
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

        {/* Catatan untuk Customer & Box Total */}
        <div className="space-y-4 pt-2">
          <div className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan untuk customer</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {quotation.notes?.trim() || "Tidak ada catatan."}
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Catatan ini akan tercantum di lembar penawaran resmi.
            </p>
          </div>

          <div className="w-full bg-[#f0f4fa] rounded-2xl p-4 sm:p-5 space-y-3 border border-blue-100/60 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatRupiah(quotation.subtotal)}</span>
            </div>
            {quotation.tax_amount > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>PPN ({quotation.tax_rate ?? 11}%)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(quotation.tax_amount)}</span>
              </div>
            )}
            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-4">
              <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">Total</span>
              <span
                className={`font-heading font-bold text-[#19376d] text-right whitespace-nowrap tabular-nums shrink-0 ${
                  quotation.total_amount >= 1_000_000_000_000
                    ? "text-xs sm:text-sm"
                    : quotation.total_amount >= 1_000_000_000
                    ? "text-sm sm:text-base"
                    : quotation.total_amount >= 100_000_000
                    ? "text-base sm:text-lg"
                    : "text-lg sm:text-xl"
                }`}
                title={formatRupiah(quotation.total_amount)}
              >
                {formatRupiah(quotation.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Catatan Info Bawah */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Kirim penawaran ke WhatsApp customer untuk mendapatkan persetujuan daring sebelum menerbitkan invoice.</span>
      </div>
    </div>
  );
}
