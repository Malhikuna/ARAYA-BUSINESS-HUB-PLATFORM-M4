"use client";

import React, { useState } from "react";
import { AlertCircle, Package, Briefcase } from "lucide-react";
import { formatRupiah, formatRibuan } from "@/lib/format";
import { generateProductSku } from "@/lib/data/mock-products";
import { ProductCategory, ProductStatus, ProductFormErrors, BusinessMode } from "@/types/product";
import { ProductFormHeader } from "@/components/produk/ProductFormHeader";
import { ProductCategoryUnitFields } from "@/components/produk/ProductCategoryUnitFields";
import { ProductStockField } from "@/components/produk/ProductStockField";
import { ProductSaveConfirmModal } from "@/components/produk/ProductSaveConfirmModal";
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
  stock?: string;
  unit?: string;
}

export interface ProductFormViewProps {
  mode: "create" | "edit";
  businessMode?: BusinessMode;
  initialValues?: ProductFormValues;
  sku?: string;
  onCancel: () => void;
  onConfirmSave: (values: ProductFormValues) => void;
}

export function ProductFormView({
  mode,
  businessMode = "Semua",
  initialValues,
  sku,
  onCancel,
  onConfirmSave,
}: ProductFormViewProps) {
  const isEdit = mode === "edit";
  const defaultCategory = businessMode === "Produk" ? "Produk" : businessMode === "Jasa" ? "Jasa" : "";

  const [form, setForm] = useState<ProductFormValues>(
    initialValues || {
      name: "",
      category: defaultCategory,
      status: "Aktif",
      price: "",
      description: "",
      stock: businessMode === "Jasa" ? "" : "0",
      unit: "",
    }
  );

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [hasSubmittedError, setHasSubmittedError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isProduct = form.category === "Produk";
  const isService = form.category === "Jasa";
  const isServiceOnly = businessMode === "Jasa";
  const isLockedCategory = Boolean(isEdit || businessMode === "Produk" || businessMode === "Jasa");

  const validate = (): ProductFormErrors => {
    const nextErrors: ProductFormErrors = {};
    if (!form.name.trim()) nextErrors.name = `Isi nama ${isProduct ? "produk" : isService ? "layanan jasa" : "item katalog"}.`;
    if (!form.category) nextErrors.category = "Pilih kategori produk atau jasa terlebih dahulu.";
    if (!form.price.trim() || BigInt(form.price.trim()) <= BigInt(0)) {
      nextErrors.price = "Isi harga satuan acuan, misalnya 1.500.000.";
    }
    if (!form.unit?.trim()) {
      nextErrors.unit = isService
        ? "Isi atau pilih satuan layanan, misalnya Paket, Jam, atau Sesi."
        : "Isi atau pilih satuan barang, misalnya Unit, Pcs, atau Rim.";
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
    if (name === "category") {
      const newCat = value as ProductCategory | "";
      setForm((prev) => ({
        ...prev,
        category: newCat,
        stock: newCat === "Jasa" ? "" : (prev.stock || "0"),
      }));
      clearFieldError("category");
      return;
    }
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

  const pageTitle = isEdit
    ? (isProduct ? "Ubah produk fisik" : isService ? "Ubah layanan jasa" : "Ubah item katalog")
    : (isProduct ? "Tambah produk (barang)" : isService ? "Tambah layanan jasa" : "Tambah item katalog");

  const pageSubtitle = isProduct
    ? "Masukkan rincian produk barang fisik, kuantitas stok gudang, dan harga jual."
    : isService
    ? "Masukkan rincian paket layanan jasa profesional dan satuan penagihan."
    : "Masukkan rincian item produk fisik atau layanan jasa baru untuk penawaran dan faktur.";

  const previewPrice = form.price.trim() ? formatRupiah(`${form.price.trim()}.00`) : "Rp 0";
  const displaySku = isEdit && sku ? sku : generateProductSku(form.name.trim() || "ITEM", (form.category as ProductCategory) || "Jasa");

  return (
    <>
      <ProductFormHeader
        isEdit={isEdit}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        hasSubmittedError={hasSubmittedError}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-300/90">
          <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-xs sm:text-sm">
              {isProduct ? <Package className="w-4 h-4 text-[#19376d]" /> : <Briefcase className="w-4 h-4 text-[#19376d]" />}
              <span>{isProduct ? "Informasi produk fisik" : isService ? "Informasi layanan jasa" : "Informasi item katalog"}</span>
            </div>
            {!isServiceOnly && (
              <span className="text-xs text-slate-500 font-mono font-semibold">
                {isProduct ? `SKU: ${displaySku}` : `Kode: ${displaySku}`}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="name" className="block text-xs font-bold text-slate-800">
                  {isProduct ? "Nama produk" : isService ? "Nama layanan jasa" : "Nama item"} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{form.name.length > 0 ? `${form.name.length}/${MAX_NAME_LENGTH}` : `Maks. ${MAX_NAME_LENGTH}`}</span>
              </div>
              <div className="relative">
                <input
                  id="name" name="name" type="text" maxLength={MAX_NAME_LENGTH} value={form.name} onChange={handleTextChange}
                  placeholder={isProduct ? "Contoh: Laptop kantor 14 inci" : isService ? "Contoh: Paket konsultasi bisnis" : "Contoh: Nama produk atau jasa"}
                  className={`w-full h-11 px-4 rounded-lg text-xs sm:text-sm text-slate-800 outline-none transition-all ${errors.name ? "bg-white border border-red-500 ring-2 ring-red-500/10" : "bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d]"}`}
                />
                {errors.name && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><AlertCircle className="w-4 h-4 text-red-600" /></div>}
              </div>
              {errors.name && <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.name}</span></div>}
            </div>

            <ProductCategoryUnitFields
              category={form.category}
              unit={form.unit}
              isLockedCategory={isLockedCategory}
              isService={isService}
              errors={errors}
              onChange={handleTextChange}
            />

            {/* Stok Fisik Khusus Produk */}
            {isProduct && (
              <ProductStockField
                stock={form.stock ?? ""}
                onChange={(stockVal) => setForm((prev) => ({ ...prev, stock: stockVal }))}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-xs font-bold text-slate-800 mb-2">
                  {isService ? "Tarif Acuan (Rp)" : "Harga Satuan (Rp)"} <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center h-11 rounded-lg overflow-hidden transition-all ${errors.price ? "bg-white border border-red-500 ring-2 ring-red-500/10" : "bg-white border border-slate-300 focus-within:border-[#19376d] focus-within:ring-1 focus-within:ring-[#19376d]"}`}>
                  <div className="h-full px-3.5 border-r flex items-center justify-center text-xs font-semibold text-slate-700 bg-[#f0f4fa] border-slate-300">Rp</div>
                  <input
                    id="price" name="price" type="text" inputMode="numeric" value={formatRibuan(form.price)} onChange={handlePriceChange} placeholder="1.500.000"
                    className="w-full h-full pl-3.5 pr-4 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800"
                  />
                </div>
                {errors.price && <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.price}</span></div>}
              </div>

              <div>
                <span id="status-katalog-label" className="block text-xs font-bold text-slate-800 mb-2">
                  Status Katalog
                </span>
                <button
                  id="status"
                  type="button"
                  role="switch"
                  aria-checked={form.status === "Aktif"}
                  aria-labelledby="status-katalog-label"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      status: prev.status === "Aktif" ? "Nonaktif" : "Aktif",
                    }))
                  }
                  className={`w-full h-11 px-3.5 rounded-lg border flex items-center justify-between gap-3 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#19376d]/25 ${
                    form.status === "Aktif"
                      ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                      : "bg-slate-50 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        form.status === "Aktif" ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        form.status === "Aktif" ? "text-emerald-800" : "text-slate-600"
                      }`}
                    >
                      {form.status === "Aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      form.status === "Aktif" ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                        form.status === "Aktif" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {form.status === "Aktif"
                    ? "Siap ditawarkan pada penawaran dan faktur."
                    : "Diarsipkan sementara dan disembunyikan dari penawaran."}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-xs font-bold text-slate-800">Deskripsi (opsional)</label>
                <span className="text-[11px] text-slate-400">{form.description.length > 0 ? `${form.description.length}/${MAX_DESCRIPTION_LENGTH}` : `Maks. ${MAX_DESCRIPTION_LENGTH}`}</span>
              </div>
              <textarea
                id="description" name="description" rows={3} maxLength={MAX_DESCRIPTION_LENGTH} value={form.description} onChange={handleTextChange}
                placeholder={isProduct ? "Spesifikasi dan rincian produk fisik" : "Cakupan layanan, durasi waktu, dan rincian paket"}
                className="w-full p-3.5 rounded-lg bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 outline-none resize-none focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] transition-all"
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
          displayName={form.name.trim() || (isProduct ? "[Nama produk]" : isService ? "[Nama layanan jasa]" : "[Nama item katalog]")}
          isNameFilled={Boolean(form.name.trim())}
          descriptionText={form.description.trim() || "Deskripsi lengkap item akan muncul di bagian ini pada formulir penawaran dan invoice digital pelanggan."}
          previewPrice={previewPrice}
          hasSubmittedError={hasSubmittedError}
          hasPriceError={Boolean(errors.price)}
          sku={isProduct ? displaySku : undefined}
        />
      </div>

      <ProductSaveConfirmModal
        open={isConfirmOpen}
        isEdit={isEdit}
        form={form}
        displaySku={displaySku}
        previewPrice={previewPrice}
        onConfirm={() => {
          setIsConfirmOpen(false);
          setIsSubmitting(true);
          onConfirmSave(form);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
