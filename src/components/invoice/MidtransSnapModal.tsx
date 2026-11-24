"use client";

import React, { useState } from "react";
import { CreditCard, ShieldCheck, X, CheckCircle2, AlertTriangle, Building2, QrCode, Wallet } from "lucide-react";
import { InvoiceRecord } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { formatDateId } from "@/lib/invoice-order-helpers";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface MidtransSnapModalProps {
  open: boolean;
  invoice: InvoiceRecord | null;
  isProcessing: boolean;
  onConfirmPaid: (paymentMethod: string) => void;
  onSimulateFailed: () => void;
  onClose: () => void;
}

const PAYMENT_CHANNELS = [
  { id: "Virtual Account BCA (Midtrans)", label: "Virtual Account BCA", desc: "Verifikasi otomatis via Midtrans", icon: Building2 },
  { id: "Virtual Account Mandiri (Midtrans)", label: "Virtual Account Mandiri", desc: "Mandiri Bill Payment Sandbox", icon: Building2 },
  { id: "QRIS (Midtrans)", label: "QRIS Instan", desc: "Scan QR semua bank & e-wallet", icon: QrCode },
  { id: "GoPay (Midtrans)", label: "GoPay", desc: "Pembayaran dompet digital", icon: Wallet },
] as const;

/**
 * Modal pembayaran Midtrans Snap Sandbox (UC-07 / PRO-60):
 * Memungkinkan simulasi settlement (Lunas otomatis) maupun gagal/batal (tetap Belum lunas sesuai BR-08).
 */
export function MidtransSnapModal({
  open,
  invoice,
  isProcessing,
  onConfirmPaid,
  onSimulateFailed,
  onClose,
}: MidtransSnapModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(PAYMENT_CHANNELS[0].id);

  if (!open || !invoice) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="midtrans-snap-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-[#19376d] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="midtrans-snap-title" className="text-sm font-heading font-bold truncate">
                Pembayaran Midtrans Snap
              </h2>
              <p className="text-[11px] text-blue-100 truncate">
                {invoice.invoice_number} | {invoice.partner_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Tutup jendela pembayaran Midtrans"
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Mode Simulasi Dev Lokal:</strong> Modal ini hanya aktif saat mode pengembangan
              ketika endpoint pembayaran backend belum tersedia, dan hanya mensimulasikan settlement pada sesi browser lokal.
            </span>
          </div>

          <div className="bg-[#f0f4fa] rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Nomor invoice</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoice_number}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Jatuh tempo</span>
              <span className="font-semibold text-slate-700">{formatDateId(invoice.due_date)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
              <span className="font-semibold text-slate-700">Total yang dibayar</span>
              <span className="text-base font-heading font-bold text-[#19376d]">
                {formatRupiah(invoice.total_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Pilih metode pembayaran</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const active = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      active
                        ? "border-[#19376d] bg-[#eef4ff]/70 ring-1 ring-[#19376d]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active ? "text-[#19376d]" : "text-slate-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{ch.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{ch.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#0e7490] shrink-0 mt-0.5" />
            <span>
              Status invoice berubah menjadi <strong>Lunas</strong> otomatis setelah notifikasi
              settlement Midtrans valid (BR-08). Pembayaran gagal atau dibatalkan mempertahankan status Belum lunas.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onSimulateFailed}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulasikan gagal</span>
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onConfirmPaid(selectedChannel)}
              className="inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? "Memproses..." : "Bayar & selesaikan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
