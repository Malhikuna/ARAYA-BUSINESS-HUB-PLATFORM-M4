import React from "react";
import Link from "next/link";
import { MessageCircle, FileText, ExternalLink, Info } from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import { buildWhatsAppUrl } from "@/components/permintaan/whatsapp-url";

export interface PermintaanDetailHeroProps {
  item: PermintaanItem;
}

export function PermintaanDetailHero({ item }: PermintaanDetailHeroProps) {
  const isNew = item.status === "Baru";
  const quoNum = item.quotationNumber || `PNW-${item.id.replace(/^PMT-?/i, "")}`;
  const waUrl = buildWhatsAppUrl(item.whatsapp);

  return (
    <>
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100 mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-2.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-800 bg-[#f0f4fa] px-3 py-1 rounded-lg">
              {item.id}
            </span>
            {isNew ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#d5f0f6] text-[#0f5368]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0e7490]" />
                <span>Baru</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Sudah ditawarkan</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight leading-tight">
            {item.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500">
            {isNew
              ? "Diterima melalui etalase daring · Membutuhkan tanggapan penawaran harga resmi"
              : "Diterima melalui etalase daring · Penawaran resmi telah diterbitkan kepada klien"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full lg:w-auto">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Hubungi WhatsApp</span>
            </a>
          ) : (
            <span className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed whitespace-nowrap">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span>WhatsApp tidak tersedia</span>
            </span>
          )}

          {isNew ? (
            <Link
              href={`/penawaran/tambah?fromPermintaan=${item.id}&customer=${encodeURIComponent(
                item.customerName
              )}&service=${encodeURIComponent(item.serviceName)}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Buat penawaran</span>
            </Link>
          ) : (
            <Link
              href={`/penawaran/lihat/${quoNum}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-[#eef4ff] hover:bg-[#dbeafe] text-[#19376d] border border-blue-200/80 text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-[#19376d]" />
              <span>Lihat penawaran {quoNum}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#19376d]" />
            </Link>
          )}
        </div>
      </div>

      {!isNew && (
        <div className="bg-[#f0f5fa] border border-[#d8e4f0] rounded-2xl p-4 sm:p-4.5 flex items-center gap-3 text-slate-700 text-xs sm:text-sm mb-6">
          <Info className="w-4 h-4 text-[#19376d] shrink-0" />
          <span>
            Penawaran sudah dibuat untuk permintaan ini. Satu permintaan hanya dapat memiliki satu penawaran.
          </span>
        </div>
      )}
    </>
  );
}
