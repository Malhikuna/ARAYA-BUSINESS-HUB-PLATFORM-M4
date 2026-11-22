"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Send, CheckCircle2, AlertCircle, ExternalLink, FilePlus2 } from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import {
  submitM5ServiceRequest,
  SubmitM5ServiceRequestResult,
} from "@/lib/data/service-requests-api";

export interface M5ServiceRequestSimulatorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (item: PermintaanItem) => void;
}

const PARTNER_PRESETS = [
  { id: "00000000-0000-0000-0000-000000000001", label: "Partner Jasa Terverifikasi (Valid - 201)" },
  { id: "00000000-0000-0000-0000-000000000002", label: "Partner Produk (Uji Tolak BR-13 - 403)" },
];

/**
 * Widget Simulator Form M5 (khusus dev-mode):
 * Mengirim payload permintaan jasa nyata ke POST /api/m4/v1/service-requests (M5 -> M4).
 */
export function M5ServiceRequestSimulatorModal({
  open,
  onClose,
  onCreated,
}: M5ServiceRequestSimulatorModalProps) {
  const [partnerId, setPartnerId] = useState(PARTNER_PRESETS[0].id);
  const [title, setTitle] = useState("Konsultasi penyusunan laporan keuangan Q4");
  const [customerName, setCustomerName] = useState("Dudi Santoso");
  const [customerEmail, setCustomerEmail] = useState("dudi.santoso@example.com");
  const [customerPhone, setCustomerPhone] = useState("081711223344");
  const [description, setDescription] = useState(
    "Membutuhkan pendampingan penyusunan laporan keuangan dan rekonsiliasi pajak untuk 2 cabang."
  );
  const [serviceKey, setServiceKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitM5ServiceRequestResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    const res = await submitM5ServiceRequest({
      partner_id: partnerId,
      title,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      description,
      serviceKey: serviceKey.trim() || undefined,
    });
    setResult(res);
    setIsSubmitting(false);
    if (res.ok) {
      onCreated(res.item);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="m5-simulator-modal-title"
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="m5-simulator-modal-title" className="text-base font-heading font-bold text-slate-900">
                Simulator Form Permintaan M5
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Dev Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              POST /api/m4/v1/service-requests (Integrasi M5 → M4)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup simulator M5"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {result && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                result.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  {result.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {result.ok
                      ? `HTTP ${result.status} — Permintaan jasa berhasil masuk ke M4!`
                      : `HTTP ${result.status || "ERR"} (${result.code}) — ${result.message}`}
                  </span>
                </span>
              </div>
              {!result.ok && result.fields && (
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {Object.entries(result.fields).map(([key, msg]) => (
                    <li key={key}>
                      <span className="font-mono font-semibold">{key}</span>: {msg}
                    </li>
                  ))}
                </ul>
              )}
              {result.ok && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px]">ID: {result.item.id}</span>
                  <Link
                    href={`/permintaan/${encodeURIComponent(result.item.id)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
                  >
                    <span>Buka detail permintaan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="m5-partner" className="block text-xs font-semibold text-slate-700 mb-1">
              Partner Tujuan (`partner_id`) <span className="text-rose-500">*</span>
            </label>
            <select
              id="m5-partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
            >
              {PARTNER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="m5-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama / Judul Permintaan Jasa <span className="text-rose-500">*</span>
            </label>
            <input
              id="m5-title"
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="m5-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Customer <span className="text-rose-500">*</span>
              </label>
              <input
                id="m5-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
              />
            </div>
            <div>
              <label htmlFor="m5-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                id="m5-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="m5-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Customer <span className="text-rose-500">*</span>
            </label>
            <input
              id="m5-email"
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
            />
          </div>

          <div>
            <label htmlFor="m5-desc" className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Kebutuhan (Opsional)
            </label>
            <textarea
              id="m5-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#19376d]"
            />
          </div>

          <div>
            <label htmlFor="m5-service-key" className="block text-xs font-semibold text-slate-700 mb-1">
              Header `X-Service-Key` Opsional (kosongkan untuk memakai Bearer Customer M1 dev)
            </label>
            <input
              id="m5-service-key"
              type="text"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="Opsional — biarkan kosong untuk simulasi Customer login M1"
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-[#19376d]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const stamp = new Date().toTimeString().slice(0, 5);
                setPartnerId(PARTNER_PRESETS[0].id);
                setTitle(`Permintaan Audit & Konsultasi M5 (${stamp})`);
                setCustomerName("PT Sinar Harapan");
                setCustomerEmail("kontak@sinarharapan.co.id");
                setCustomerPhone("081299887766");
                setDescription("Permintaan simulasi dari katalog etalase Modul 5.");
                setResult(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-[#19376d]" />
              <span>Isi contoh</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengirim..." : "Kirim ke M4"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
