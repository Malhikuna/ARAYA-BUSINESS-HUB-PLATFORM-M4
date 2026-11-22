import React from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Store,
  Building,
  Building2,
  User,
  BadgeCheck,
  ExternalLink,
  Briefcase,
  Quote,
} from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import { buildWhatsAppUrl } from "@/components/permintaan/whatsapp-url";

export interface PermintaanDetailContentProps {
  item: PermintaanItem;
}

export function PermintaanDetailContent({ item }: PermintaanDetailContentProps) {
  const waUrl = buildWhatsAppUrl(item.whatsapp);

  return (
    <div className="space-y-6">
      {/* Card 1: Isi Permintaan */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <FileText className="w-4 h-4 text-[#19376d]" />
            <span>Isi permintaan</span>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500">
            ID tiket: {item.ticketId}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-1.5">
              Nama permintaan
            </span>
            <div className="text-sm font-bold text-slate-900">{item.title}</div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-1.5">
              Jasa diminati
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef4ff] text-[#19376d] text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>
                {item.serviceName} ({item.serviceCode})
              </span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-1.5">
              Pesan customer
            </span>
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <Quote className="w-5 h-5 text-[#0e7490] shrink-0 mt-0.5 rotate-180" />
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                &ldquo;{item.message}&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Waktu masuk</span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                {item.date}, {item.time}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Sumber permintaan</span>
              </div>
              <div className="text-xs font-bold text-[#19376d]">
                {item.source}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Estimasi cakupan</span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                {item.scope}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Informasi Customer */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-[#19376d]" />
            <span>Informasi customer</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#19376d] border border-blue-200/80 shadow-2xs">
            <BadgeCheck className="w-3.5 h-3.5 text-[#19376d] shrink-0" />
            <span>Akun customer</span>
          </span>
        </div>

        <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                item.customerAvatarBg || "bg-blue-100 text-blue-700"
              }`}
            >
              {item.customerInitials || "C"}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-heading font-bold text-slate-900 truncate">
                {item.customerName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {item.industry}
              </p>
            </div>
          </div>

          {item.customerId && (
            <Link
              href={`/pelanggan/lihat/${item.customerId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#19376d] hover:text-[#122852] bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <span>Buka profil pelanggan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Kontak person</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900">
              {item.contactPerson}
            </div>
            <div className="text-[11px] text-slate-500">{item.contactRole}</div>
          </div>

          <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-slate-100 space-y-1">
            <div className="text-slate-500 text-xs">
              <span>Nomor WhatsApp</span>
            </div>
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{item.whatsapp}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ) : (
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-500">
                {item.whatsapp || "-"}
              </span>
            )}
            <div className="text-[11px] text-slate-500">
              {waUrl ? "Dapat dihubungi langsung" : "Nomor WhatsApp belum tersedia"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
