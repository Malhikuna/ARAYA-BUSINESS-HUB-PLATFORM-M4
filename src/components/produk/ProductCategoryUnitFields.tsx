import React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { ProductCategory, ProductFormErrors } from "@/types/product";

export interface ProductCategoryUnitFieldsProps {
  category: "" | ProductCategory;
  unit?: string;
  isLockedCategory: boolean;
  isService: boolean;
  errors: ProductFormErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

/**
 * Pilihan kategori (Produk/Jasa) dan input satuan penagihan/barang dengan validasi.
 */
export function ProductCategoryUnitFields({
  category,
  unit,
  isLockedCategory,
  isService,
  errors,
  onChange,
}: ProductCategoryUnitFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="category" className="block text-xs font-bold text-slate-800 mb-2">
          Kategori <span className="text-red-500">*</span>
        </label>
        {isLockedCategory ? (
          <div className="w-full h-11 px-4 rounded-lg bg-[#f0f4fa] border border-[#c5d5ea] flex items-center text-xs sm:text-sm font-semibold text-[#19376d]">
            <span>{category === "Produk" ? "Produk (Barang Fisik)" : "Jasa (Layanan)"}</span>
          </div>
        ) : (
          <div className="relative">
            <select
              id="category"
              name="category"
              value={category}
              onChange={onChange}
              className={`w-full h-11 pl-4 pr-10 rounded-lg text-xs sm:text-sm outline-none appearance-none cursor-pointer transition-all ${
                errors.category
                  ? "border-red-500 ring-2 ring-red-500/10"
                  : "border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d]"
              } bg-white border text-slate-800`}
            >
              <option value="">Pilih kategori</option>
              <option value="Produk">Produk (Barang Fisik)</option>
              <option value="Jasa">Jasa (Layanan)</option>
            </select>
            <ChevronDown aria-hidden="true" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
          </div>
        )}
        {errors.category && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.category}</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="unit" className="block text-xs font-bold text-slate-800 mb-2">
          {isService ? "Satuan Layanan" : "Satuan Barang"} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="unit"
            name="unit"
            type="text"
            value={unit || ""}
            onChange={onChange}
            placeholder={isService ? "Contoh: Paket, Jam, Sesi, Bulan, Proyek" : "Contoh: Unit, Pcs, Rim, Box"}
            className={`w-full h-11 px-4 rounded-lg text-xs sm:text-sm text-slate-800 outline-none transition-all ${
              errors.unit
                ? "bg-white border border-red-500 pr-10 ring-2 ring-red-500/10"
                : "bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d]"
            }`}
          />
          {errors.unit && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          )}
        </div>
        {errors.unit ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.unit}</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isService
              ? "Contoh satuan penagihan: Paket, Jam, Sesi, Bulan, atau Proyek."
              : "Contoh satuan fisik: Unit, Pcs, Rim, Box, atau Karton."}
          </p>
        )}
      </div>
    </div>
  );
}

