import React from "react";
import Link from "next/link";
import { ArrowRight, History, Check } from "lucide-react";
import { PermintaanItem } from "@/types/permintaan";
import { useDevRole } from "@/lib/auth/dev-role";
import {
  buildCreateQuotationHref,
  resolveLinkedQuotationLink,
} from "@/lib/data/service-requests-api";

export interface PermintaanDetailSidebarProps {
  item: PermintaanItem;
}

export function PermintaanDetailSidebar({ item }: PermintaanDetailSidebarProps) {
  const { profile } = useDevRole();
  const isOffered = item.status === "Sudah ditawarkan";
  const linkedQuotation = resolveLinkedQuotationLink(item);
  const quoLabel = linkedQuotation?.label || "Penawaran terkait";

  const steps = [
    {
      num: 1,
      title: "Buat penawaran",
      description: isOffered
        ? `Draft ${quoLabel} telah dibuat dan diterbitkan.`
        : "Buat draft penawaran harga sesuai kebutuhan customer.",
      status: isOffered ? "done" : "active",
      statusLabel: isOffered ? "Selesai" : "Sedang berjalan",
    },
    {
      num: 2,
      title: "Kirim ke WhatsApp",
      description: "Dokumen penawaran dikirim langsung ke customer.",
      status: isOffered ? "active" : "upcoming",
      statusLabel: isOffered ? "Sedang berjalan" : undefined,
    },
    {
      num: 3,
      title: "Customer menyetujui",
      description: "Penawaran disepakati dan siap ditagihkan.",
      status: "upcoming" as const,
      statusLabel: undefined,
    },
    {
      num: 4,
      title: "Invoice dibuat",
      description: "Terbitkan tagihan penjualan resmi.",
      status: "upcoming" as const,
      statusLabel: undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Card 1: Langkah Berikutnya */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5">
        <div>
          <h2 className="text-sm font-heading font-bold text-slate-900">
            Langkah berikutnya
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur proses dari permintaan hingga invoice
          </p>
        </div>

        <div className="relative space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((s) => {
            const isDone = s.status === "done";
            const isActive = s.status === "active";

            return (
              <div key={s.num} className="relative flex items-start gap-3">
                <span
                  className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white shrink-0 mt-0.5 ${
                    isDone || isActive
                      ? "bg-[#19376d] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : s.num}
                </span>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {s.title}
                    </span>
                    {s.statusLabel && (
                      <span
                        className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold leading-normal ${
                          s.statusLabel === "Selesai"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-[#eef4ff] text-[#19376d]"
                        }`}
                      >
                        {s.statusLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {isOffered ? (
          <Link
            href={linkedQuotation?.href || "/penawaran"}
            className="w-full h-11 rounded-xl bg-[#eef4ff] hover:bg-[#dbeafe] text-[#19376d] border border-blue-200/80 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <span>
              {linkedQuotation ? `Lihat detail penawaran ${linkedQuotation.label}` : "Lihat daftar penawaran"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={buildCreateQuotationHref(item)}
            className="w-full h-11 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span>Mulai buat penawaran sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Card 2: Riwayat Aktivitas */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
          <History className="w-4 h-4 text-[#19376d]" />
          <span>Riwayat aktivitas</span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0e7490]" />
              <span>Permintaan diterima dari katalog customer</span>
            </div>
            <div className="pl-4 text-[11px] text-slate-500">
              {item.date}, {item.time}
            </div>
          </div>

          {isOffered && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Penawaran {quoLabel} telah diterbitkan</span>
              </div>
              <div className="pl-4 text-[11px] text-slate-500">
                {item.date}, {item.time}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOffered ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span>Status saat ini</span>
            </div>
            <div className="pl-4 text-[11px] text-slate-600">
              {isOffered
                ? "Penawaran harga telah dibuat dan proposal siap/telah terkirim."
                : `Menunggu penawaran harga dibuat oleh ${profile.name}.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
