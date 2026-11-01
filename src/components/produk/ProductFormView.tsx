"use client";

import React, { useState } from "react";
import { ChevronDown, AlertCircle, Package } from "lucide-react";
import { formatRupiah, formatRibuan } from "@/lib/format";
import { generateProductSku } from "@/lib/data/mock-products";
import { ProductCategory, ProductStatus, ProductFormErrors } from "@/types/product";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ProductCatalogSidebar } from "@/components/produk/ProductCatalogSidebar";

const MAX_NAME_LENGTH = 100;
const MAX_PRICE_DIGITS = 15;
const MAX_DESCRIPTION_LENGTH = 250;

export interface ProductFormValues {
  name: string;
  category: "" | ProductCategory;
  status: ProductStatus;
  price: string;
  description: string;
}

export interface ProductFormViewProps {
  mode: "create" | "edit";
  initialValues?: ProductFormValues;
  sku?: string;
  onCancel: () => void;
  onConfirmSave: (values: ProductFormValues) => void;
}

export function ProductFormView({
  mode,
  initialValues = { name: "", category: "", status: "Aktif", price: "", description: "" },
  sku,
  onCancel,
  onConfirmSave,
}: ProductFormViewProps) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [hasSubmittedError, setHasSubmittedError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const validate = (): ProductFormErrors => {
    const nextErrors: ProductFormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Isi nama produk/jasa, misalnya Paket konsultasi bisnis.";
    if (!form.category) nextErrors.category = "Pilih kategori produk atau jasa terlebih dahulu.";
    if (!form.price.trim() || BigInt(form.price.trim()) <= BigInt(0)) {
      nextErrors.price = "Isi harga satuan produk/jasa, misalnya 1.500.000.";
    }
    return nextErrors;
  };

  const clearFieldError = (field: keyof ProductFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) setHasSubmittedError(false);
        return next;
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name in errors) clearFieldError(name as keyof ProductFormErrors);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);
    setForm((prev) => ({ ...prev, price: digitsOnly }));
    clearFieldError("price");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setHasSubmittedError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setHasSubmittedError(false);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    setIsSubmitting(true);
    onConfirmSave(form);
  };

  const previewPrice = form.price.trim() ? formatRupiah(`${form.price.trim()}.00`) : "Rp 0";
  const displaySku = isEdit && sku ? sku : generateProductSku(form.name.trim() || "ITEM", (form.category as ProductCategory) || "Jasa");

  return (
    <>
      <Breadcrumb separator="/" items={[{ label: "Produk/jasa", href: "/produk" }, { label: isEdit ? "Ubah" : "Tambah" }]} className="mb-3" />
      <BackLink href="/produk" label="Kembali ke daftar produk/jasa" />

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
          {isEdit ? "Ubah produk/jasa" : "Tambah produk/jasa"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isEdit
            ? "Perbarui rincian item produk fisik atau layanan jasa untuk katalog penawaran dan faktur."
            : "Masukkan rincian item produk fisik atau layanan jasa baru untuk katalog penawaran dan faktur."}
        </p>
      </div>

      <FormAlertBanner visible={hasSubmittedError} title="Data belum lengkap" description="Lengkapi kolom yang ditandai merah, lalu simpan lagi." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-300/90">
          {isEdit && sku && (
            <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-xs sm:text-sm">
                <Package className="w-4 h-4 text-[#19376d]" />
                <span>Informasi item katalog</span>
              </div>
              <span className="text-xs text-slate-500 font-mono font-semibold">SKU: {sku}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="name" className="block text-xs font-bold text-slate-800">Nama produk/jasa <span className="text-red-500">*</span></label>
                <span className="text-[11px] text-slate-400">{form.name.length > 0 ? `${form.name.length}/${MAX_NAME_LENGTH} karakter` : `Maks. ${MAX_NAME_LENGTH} karakter`}</span>
              </div>
              <div className="relative">
                <input
                  id="name" name="name" type="text" maxLength={MAX_NAME_LENGTH} value={form.name} onChange={handleTextChange} placeholder="Contoh: Paket konsultasi bisnis"
                  className={`w-full h-11 px-4 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all ${errors.name ? "bg-white border border-red-500 pr-10 ring-2 ring-red-500/10" : "bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d]"}`}
                />
                {errors.name && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><AlertCircle className="w-4 h-4 text-red-600" /></div>}
              </div>
              {errors.name ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.name}</span></div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">Gunakan nama yang jelas agar mudah diidentifikasi saat menyusun penawaran.</p>
              )}
            </div>

            <div className={isEdit ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-slate-800 mb-2">Kategori <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="category" name="category" value={form.category} onChange={handleTextChange}
                    className={`w-full h-11 pl-4 pr-10 rounded-lg text-xs sm:text-sm outline-none appearance-none cursor-pointer transition-all ${form.category ? "text-slate-800" : "text-slate-700"} ${errors.category ? "bg-white border border-red-500 ring-2 ring-red-500/10" : "bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d]"}`}
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Produk">Produk</option>
                    <option value="Jasa">Jasa</option>
                  </select>
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${errors.category ? "text-red-500" : "text-slate-500"}`} />
                </div>
                {errors.category && <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.category}</span></div>}
              </div>

              {isEdit && (
                <div>
                  <label htmlFor="status" className="block text-xs font-bold text-slate-800 mb-2">Status item</label>
                  <div className="relative">
                    <select
                      id="status" name="status" value={form.status} onChange={handleTextChange}
                      className="w-full h-11 pl-4 pr-10 rounded-lg text-xs sm:text-sm text-slate-800 bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] outline-none appearance-none cursor-pointer transition-all"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                    <ChevronDown aria-hidden="true" className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-xs font-bold text-slate-800 mb-2">Harga (Rp) <span className="text-red-500">*</span></label>
              <div className={`flex items-center h-11 rounded-lg overflow-hidden transition-all relative ${errors.price ? "bg-white border border-red-500 ring-2 ring-red-500/10" : "bg-white border border-slate-300 focus-within:border-[#19376d] focus-within:ring-1 focus-within:ring-[#19376d]"}`}>
                <div className={`h-full px-3.5 border-r flex items-center justify-center text-xs font-semibold text-slate-700 select-none shrink-0 ${errors.price ? "bg-red-50/60 border-red-300" : "bg-[#f0f4fa] border-slate-300"}`}>Rp</div>
                <input
                  id="price" name="price" type="text" inputMode="numeric" value={formatRibuan(form.price)} onChange={handlePriceChange} placeholder="1.500.000"
                  className="w-full h-full pl-3.5 pr-10 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
                />
                {errors.price && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><AlertCircle className="w-4 h-4 text-red-600" /></div>}
              </div>
              {errors.price ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.price}</span></div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">Harga satuan dasar sebelum pengenaan PPN 11% dan diskon transaksi.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-xs font-bold text-slate-800">Deskripsi (opsional)</label>
                <span className="text-[11px] text-slate-400">{form.description.length > 0 ? `${form.description.length}/${MAX_DESCRIPTION_LENGTH} karakter` : `Maks. ${MAX_DESCRIPTION_LENGTH} karakter`}</span>
              </div>
              <textarea
                id="description" name="description" rows={4} maxLength={MAX_DESCRIPTION_LENGTH} value={form.description} onChange={handleTextChange} placeholder="Tulis deskripsi singkat"
                className="w-full p-3.5 rounded-lg bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] transition-all"
              />
            </div>

            <div className="pt-5 border-t border-slate-300 flex items-center justify-end gap-3">
              <button type="button" onClick={onCancel} className="px-5 h-10 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer">Batal</button>
              <button type="submit" disabled={isSubmitting} className="px-6 h-10 rounded-lg bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer">
                {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Simpan"}
              </button>
            </div>
          </form>
        </div>

        <ProductCatalogSidebar
          mode={mode}
          categoryLabel={form.category || "Kategori draft"}
          displayName={form.name.trim() || "[Nama produk/jasa]"}
          isNameFilled={Boolean(form.name.trim())}
          descriptionText={form.description.trim() || "Deskripsi lengkap item akan muncul di bagian ini pada formulir penawaran dan invoice digital pelanggan."}
          previewPrice={previewPrice}
          hasSubmittedError={hasSubmittedError}
          hasPriceError={Boolean(errors.price)}
          sku={sku}
        />
      </div>

      <ConfirmationModal
        open={isConfirmOpen}
        title={isEdit ? "Simpan perubahan produk/jasa?" : "Simpan produk/jasa baru?"}
        subtitle={isEdit ? "Konfirmasi pembaruan item katalog" : "Konfirmasi penambahan item katalog"}
        description={
          isEdit
            ? "Perubahan rincian nama, kategori, status, maupun harga item ini akan langsung diterapkan pada katalog produk/jasa."
            : "Item baru yang disimpan akan langsung aktif dan dapat dipilih saat menyusun dokumen penawaran maupun invoice."
        }
        confirmLabel={isEdit ? "Ya, simpan perubahan" : "Ya, simpan"}
        variant={isEdit ? "primary" : "success"}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900">{form.name.trim()}</div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              {displaySku} | {form.category || "Jasa"} | {isEdit ? form.status : "Aktif"}
            </div>
          </div>
          <div className="text-xs font-heading font-bold text-[#19376d] shrink-0">{previewPrice}</div>
        </div>
        {form.description.trim() && (
          <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">{form.description.trim()}</div>
        )}
      </ConfirmationModal>
    </>
  );
}

