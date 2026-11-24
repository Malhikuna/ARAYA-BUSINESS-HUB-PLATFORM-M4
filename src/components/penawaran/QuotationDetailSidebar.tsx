"use client";

import React from "react";
import {
  FileText,
  Download,
  Printer,
  Check,
  CheckCircle2,
  MessageCircle,
  Info,
  ReceiptText,
} from "lucide-react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { useDevRole } from "@/lib/auth/dev-role";
import {
  derivePermintaanIdFromQuotationNumber,
  formatJamSingkat,
  formatTanggalIndo,
  formatWaktuPembaruan,
  normalizeQuotationStatus,
} from "@/lib/data/mock-quotations";
import { QuotationWhatsAppPreviewCard } from "@/components/penawaran/QuotationWhatsAppPreviewCard";

export interface QuotationDetailSidebarProps {
  quotation: Quotation;
  isSendingWa?: boolean;
  onSendToWhatsApp: () => void;
  onCreateInvoice?: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
}

/**
 * Sidebar kanan halaman detail penawaran Partner Jasa.
 * Menampilkan Pratinjau WhatsApp, Riwayat Aktivitas, & Tahapan Penawaran.
 */
export function QuotationDetailSidebar({
  quotation,
  isSendingWa = false,
  onSendToWhatsApp,
  onCreateInvoice,
  onDownloadPdf,
  onPrint,
}: QuotationDetailSidebarProps) {
  const { profile } = useDevRole();
  const canonicalStatus = normalizeQuotationStatus(quotation.status);
  const isDraft = canonicalStatus === "DRAFT";
  const isApproved = canonicalStatus === "APPROVED";
  const isSent = canonicalStatus === "SENT";
  const isRejected = canonicalStatus === "REJECTED";

  const createdTimestamp = quotation.created_at || quotation.createdAt || quotation.updated_at;
  const createdTimeLabel = formatJamSingkat(createdTimestamp);
  const createdDateTimeLabel = createdTimestamp
    ? formatWaktuPembaruan(createdTimestamp)
    : formatTanggalIndo(quotation.quotation_date);
  const derivedPmtId =
    quotation.permintaan_id || derivePermintaanIdFromQuotationNumber(quotation.quotation_number);

  // Mode Draf: tampilkan pratinjau pesan WhatsApp & tahapan awal
  if (isDraft) {
    return (
      <div className="space-y-6">
        <QuotationWhatsAppPreviewCard
          quotation={quotation}
          isSending={isSendingWa}
          onSendToWhatsApp={onSendToWhatsApp}
        />

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Tahapan penawaran</h2>
            <span className="text-xs text-slate-400 font-medium">1 aktivitas</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#19376d] mt-1 shrink-0" />
              <div className="space-y-0.5 text-xs min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Draf dibuat dari permintaan</span>
                  {createdTimeLabel && (
                    <span className="text-slate-400 text-[11px] font-mono">{createdTimeLabel}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {derivedPmtId
                    ? `Dibuat dari permintaan ${derivedPmtId}`
                    : "Draf penawaran dibuat"}{" "}
                  | {createdDateTimeLabel} | Oleh {profile.name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f5fa] border border-[#d8e4f0] rounded-xl p-3 flex items-start gap-2 text-[11px] text-slate-600">
            <Info className="w-3.5 h-3.5 text-[#19376d] shrink-0 mt-0.5" />
            <span>Kirim penawaran ke WhatsApp customer untuk mendapatkan persetujuan sebelum menerbitkan invoice.</span>
          </div>
        </div>
      </div>
    );
  }

  const sentTimeLabel = formatJamSingkat(quotation.sent_at || quotation.updated_at || createdTimestamp);
  const approvedTimeLabel = formatJamSingkat(quotation.approved_at || quotation.updated_at || createdTimestamp);

  if (isApproved) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Riwayat aktivitas</h2>
            <span className="text-xs text-slate-400 font-medium">3 aktivitas</span>
          </div>

          <div className="relative space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div className="relative pl-5 space-y-0.5 text-xs">
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[#0e7490] ring-4 ring-white" />
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Disetujui customer</span>
                </span>
                {approvedTimeLabel && (
                  <span className="text-[11px] text-slate-400 font-mono">{approvedTimeLabel}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Disetujui oleh {quotation.customer_name} melalui portal daring customer
              </p>
            </div>

            <div className="relative pl-5 space-y-0.5 text-xs">
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-white" />
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dikirim lewat WhatsApp</span>
                </span>
                {sentTimeLabel && (
                  <span className="text-[11px] text-slate-400 font-mono">{sentTimeLabel}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tautan portal penawaran dikirim ke nomor {quotation.customer_phone || "customer"}
              </p>
            </div>

            <div className="relative pl-5 space-y-0.5 text-xs">
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-white" />
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">
                  {derivedPmtId ? `Dibuat dari permintaan ${derivedPmtId}` : "Penawaran dibuat"}
                </span>
                {createdTimeLabel && (
                  <span className="text-[11px] text-slate-400 font-mono">{createdTimeLabel}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {derivedPmtId ? `Dibuat dari permintaan ${derivedPmtId}` : "Draf penawaran dibuat"} | Oleh {profile.name}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-[#19376d]" />
              <h2 className="text-sm font-bold text-slate-900">Status pembuatan invoice</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              Siap diterbitkan
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Penawaran <strong>{quotation.quotation_number}</strong> senilai{" "}
            <strong className="text-[#19376d]">{formatRupiah(quotation.total_amount)}</strong> telah
            disetujui customer dan siap dikonversi menjadi invoice tagihan.
          </p>
          <div className="space-y-2">
            {onCreateInvoice && (
              <button
                type="button"
                onClick={onCreateInvoice}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#19376d] hover:bg-[#122852] text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <ReceiptText className="w-4 h-4" />
                <span>Buat invoice sekarang</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh format PDF</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak dokumen</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode Terkirim / Disetujui (Customer) / Ditolak
  const steps = [
    {
      num: 1,
      title: "Draf",
      badge: "Selesai",
      badgeClass: "bg-slate-100 text-slate-600",
      description: "Susun rincian jasa dan harga penawaran",
      status: "done",
    },
    {
      num: 2,
      title: "Kirim ke WhatsApp",
      hasWaIcon: true,
      description: "Kirim dokumen resmi penawaran langsung ke kontak WhatsApp customer",
      status: isApproved || isRejected ? "done" : "active",
      badge: isApproved || isRejected ? "Selesai" : "Sedang berjalan",
      badgeClass: isApproved || isRejected ? "bg-slate-100 text-slate-600" : "bg-[#eef4ff] text-[#19376d]",
    },
    {
      num: 3,
      title: "Disetujui customer",
      description: "Customer meninjau dan memberikan persetujuan",
      status: isApproved ? "done" : "upcoming",
      badge: isApproved
        ? "Disetujui"
        : isRejected
        ? "Ditolak"
        : isSent
        ? "Menunggu respon"
        : undefined,
      badgeClass: isApproved
        ? "bg-emerald-50 text-emerald-700"
        : isRejected
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700",
    },
    {
      num: 4,
      title: "Invoice",
      description: "Terbitkan tagihan penjualan setelah disepakati",
      status: isApproved ? "active" : "upcoming",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Tahapan penawaran</h2>
          <span className="w-2 h-2 rounded-full bg-[#19376d]" />
        </div>

        <div className="relative space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((s) => {
            const isDone = s.status === "done";
            const isActive = s.status === "active";

            return (
              <div key={s.num} className="relative flex items-start gap-3">
                <span
                  className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white shrink-0 mt-0.5 ${
                    isDone || isActive ? "bg-[#19376d] text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : s.num}
                </span>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">{s.title}</span>
                      {s.hasWaIcon && <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    {s.badge && (
                      <span className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${s.badgeClass}`}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#19376d]" />
            <h2 className="text-sm font-bold text-slate-900">Rangkuman dokumen</h2>
          </div>
          <span className="font-mono text-xs font-bold text-[#19376d]">{quotation.quotation_number}</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Penerima</span>
            <span className="font-bold text-slate-900">{quotation.customer_name}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Jumlah jasa</span>
            <span className="font-semibold text-slate-800">{quotation.items.length} item layanan</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="font-bold text-slate-900 text-xs shrink-0">Total penawaran</span>
            <span
              className={`font-heading font-bold text-[#19376d] text-right whitespace-nowrap tabular-nums shrink-0 ${
                quotation.total_amount >= 1_000_000_000_000
                  ? "text-xs"
                  : quotation.total_amount >= 1_000_000_000
                  ? "text-xs sm:text-sm"
                  : quotation.total_amount >= 100_000_000
                  ? "text-sm"
                  : "text-sm sm:text-base"
              }`}
              title={formatRupiah(quotation.total_amount)}
            >
              {formatRupiah(quotation.total_amount)}
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh format PDF</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#eef4ff] hover:bg-[#e2edff] text-xs font-bold text-[#19376d] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak dokumen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
