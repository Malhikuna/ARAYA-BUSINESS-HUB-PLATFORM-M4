import React from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";

export interface ProductFormHeaderProps {
  isEdit: boolean;
  pageTitle: string;
  pageSubtitle: string;
  hasSubmittedError: boolean;
}

/**
 * Header area formulir item katalog: navigasi breadcrumb, tombol kembali,
 * judul/sub-judul halaman, dan banner notifikasi validasi formulir.
 */
export function ProductFormHeader({
  isEdit,
  pageTitle,
  pageSubtitle,
  hasSubmittedError,
}: ProductFormHeaderProps) {
  return (
    <>
      <Breadcrumb
        separator="/"
        items={[{ label: "Katalog", href: "/produk" }, { label: isEdit ? "Ubah" : "Tambah" }]}
        className="mb-3"
      />
      <BackLink href="/produk" label="Kembali ke katalog" />

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
      </div>

      <FormAlertBanner
        visible={hasSubmittedError}
        title="Data belum lengkap"
        description="Lengkapi kolom yang ditandai merah, lalu simpan lagi."
      />
    </>
  );
}

