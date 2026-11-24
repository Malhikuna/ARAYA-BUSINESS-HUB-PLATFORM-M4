"use client";

import React from "react";
import { ClipboardList, MessageCircle, Store } from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import { buildWhatsAppUrl } from "@/components/permintaan/whatsapp-url";

export interface QuotationFromPermintaanCardProps {
  permintaan: PermintaanItem;
}

/**
 * Card informasi rujukan permintaan layanan pada form Buat Penawaran.
 */
export function QuotationFromPermintaanCard({
  permintaan,
}: QuotationFromPermintaanCardProps) {
  const waUrl = buildWhatsAppUrl(permintaan.whatsapp);
  const displayCode = permintaan.displayCode || permintaan.id;
  const contactName = permintaan.contactPerson || permintaan.customerName;
  const fallbackInitials = permintaan.customerName
    .replace(/^(PT|CV|UD)\s+/i, "")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 border-l-4 border-l-[#19376d] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#19376d] flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-[#19376d]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Dari permintaan</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0284c7]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
          <span>Permintaan aktif #{displayCode}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="space-y-3">
          <div>
            <span className="text-slate-400 text-[11px] block mb-1">Judul permintaan</span>
            <span className="font-bold text-slate-900 text-sm">
              {displayCode} | {permintaan.title}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              {permintaan.customerInitials || fallbackInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 truncate">
                  {permintaan.customerName}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  Akun customer
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-slate-400 text-[11px] block mb-1">Narahubung & WhatsApp</span>
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-800 font-semibold hover:text-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {contactName} ({permintaan.whatsapp})
                </span>
              </a>
            ) : (
              <span className="text-slate-600 font-semibold">
                {contactName}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block mb-1">Sumber permintaan</span>
            <div className="inline-flex items-center gap-2 text-slate-700">
              <Store className="w-4 h-4 text-[#19376d] shrink-0" />
              <span>Terhubung otomatis dari Katalog Jasa (Etalase M5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
