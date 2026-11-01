import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";

export interface UnderConstructionViewProps {
  moduleName: string;
  icon: LucideIcon;
  description?: string;
}

export function UnderConstructionView({
  moduleName,
  icon: ModuleIcon,
  description,
}: UnderConstructionViewProps) {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: moduleName }]} className="mb-6" />

      {/* Simple Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-10 sm:p-14 text-center max-w-lg mx-auto my-10">
        <div className="w-16 h-16 rounded-2xl bg-[#eef4ff] text-[#19376d] flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-2xs">
          <ModuleIcon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Dalam Proses Pengerjaan</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mb-2">
          Modul {moduleName}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
          {description ||
            `Halaman untuk modul ${moduleName.toLowerCase()} sedang dalam proses pengerjaan dan akan segera tersedia.`}
        </p>

        <Link
          href="/pelanggan"
          className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pelanggan</span>
        </Link>
      </div>
    </div>
  );
}
