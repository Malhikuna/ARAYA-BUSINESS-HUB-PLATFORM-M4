"use client";

import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Eye,
  ShieldCheck,
  Info,
  AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

export interface CustomerProfileSidebarProps {
  title?: string;
  statusVariant: "draft" | "active" | "error";
  initials: string;
  displayName: string;
  phoneText: string;
  emailText: string;
  addressText: string;
  isItalicPlaceholder?: boolean;
  customerId?: string;
}

export function CustomerProfileSidebar({
  title = "Pratinjau profil pelanggan",
  statusVariant,
  initials,
  displayName,
  phoneText,
  emailText,
  addressText,
  isItalicPlaceholder = true,
  customerId,
}: CustomerProfileSidebarProps) {
  const infoTextClass = isItalicPlaceholder
    ? "truncate italic text-slate-500"
    : "truncate text-slate-600";

  return (
    <div className="lg:col-span-4 space-y-5">
      {/* Card 1: Pratinjau Profil Pelanggan */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <Eye className="w-4 h-4 text-[#19376d]" />
            <span>{title}</span>
          </div>

          {statusVariant === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
              <span>Data belum lengkap</span>
            </span>
          ) : statusVariant === "active" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#eef4ff] text-[#19376d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19376d]" />
              Draf
            </span>
          )}
        </div>

        <div className="bg-[#f0f4fa] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#102a54] text-white flex items-center justify-center font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 text-sm truncate">
                {displayName}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <Building2 className="w-3 h-3" />
                <span>Akun korporat / retail</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={`${infoTextClass} ${!isItalicPlaceholder ? "font-mono" : ""}`}>
                {phoneText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={infoTextClass}>{emailText}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className={`${isItalicPlaceholder ? infoTextClass : "text-slate-600"} leading-relaxed`}>
                {addressText}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Faktur terhubung</div>
            <div className="text-sm font-bold text-slate-900">
              {customerId === "CUST-001" ? "3 Dokumen" : "0 Dokumen"}
            </div>
          </div>
          <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Total piutang</div>
            <div className="text-sm font-bold text-[#0e7490]">{formatRupiah(0)}</div>
          </div>
        </div>
      </div>

      {/* Card 2: Kepatuhan Faktur & Perpajakan */}
      <div className="bg-[#edf3fc] border border-blue-100/70 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#19376d]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Kepatuhan faktur &amp; perpajakan</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Data pelanggan yang lengkap menjamin validitas pengiriman faktur pajak elektronik (e-Faktur) dan mempercepat siklus persetujuan dokumen penawaran harga.
        </p>
        <div className="flex items-start gap-1.5 text-[11px] font-semibold text-[#19376d] pt-1">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {customerId ? (
            <span>
              ID Pelanggan: <span className="font-mono">{customerId}</span> (Terdaftar di sistem)
            </span>
          ) : (
            <span>ID Pelanggan otomatis dihasilkan oleh sistem saat disimpan.</span>
          )}
        </div>
      </div>
    </div>
  );
}

