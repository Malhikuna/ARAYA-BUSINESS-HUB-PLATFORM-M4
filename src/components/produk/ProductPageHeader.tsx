import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BusinessMode } from "@/types/product";

export interface ProductPageHeaderProps {
  businessMode: BusinessMode;
}

/**
 * Header judul dan tombol aksi tambah item katalog produk & jasa.
 */
export function ProductPageHeader({ businessMode }: ProductPageHeaderProps) {
  const pageTitle =
    businessMode === "Produk"
      ? "Katalog Produk"
      : businessMode === "Jasa"
      ? "Katalog Jasa & Layanan"
      : "Katalog Produk & Jasa";

  const pageSubtitle =
    businessMode === "Produk"
      ? "Kelola katalog produk fisik, kuantitas stok persediaan gudang, dan harga jual"
      : businessMode === "Jasa"
      ? "Kelola daftar paket layanan jasa profesional, tarif acuan, dan penawaran"
      : "Kelola katalog produk fisik dan layanan jasa untuk penawaran dan tagihan";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <Link
          href={businessMode === "Semua" ? "/produk/tambah" : `/produk/tambah?mode=${businessMode}`}
          className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold shadow-xs transition-all w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>
            {businessMode === "Semua"
              ? "Tambah item katalog"
              : businessMode === "Produk"
              ? "Tambah produk"
              : "Tambah layanan jasa"}
          </span>
        </Link>
      </div>
    </div>
  );
}

