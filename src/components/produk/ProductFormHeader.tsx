import React from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";

export interface ProductFormHeaderProps {
  isEdit: boolean;
  pageTitle: string;
  pageSubtitle: string;
  breadcrumbParentLabel?: string;
  breadcrumbCurrentLabel?: string;
  backLabel?: string;
  hasSubmittedError?: boolean;
  onBack?: () => void;
}

/**
 * Header area formulir item katalog: navigasi breadcrumb, tombol kembali,
 * dan judul/sub-judul halaman.
 */
export function ProductFormHeader({
  isEdit,
  pageTitle,
  pageSubtitle,
  breadcrumbParentLabel = "Katalog",
  breadcrumbCurrentLabel,
  backLabel = "Kembali ke katalog",
  onBack,
}: ProductFormHeaderProps) {
  return (
    <>
      <Breadcrumb
        separator="/"
        items={[
          { label: breadcrumbParentLabel, href: "/produk" },
          { label: breadcrumbCurrentLabel || (isEdit ? "Ubah" : "Tambah") },
        ]}
        className="mb-3"
      />
      <BackLink href="/produk" label={backLabel} onClick={onBack} />

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
      </div>
    </>
  );
}

