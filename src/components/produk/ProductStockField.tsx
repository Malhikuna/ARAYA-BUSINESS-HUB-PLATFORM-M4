import React from "react";

export interface ProductStockFieldProps {
  stock: string;
  onChange: (value: string) => void;
}

/**
 * Bidang input kuantitas stok gudang khusus produk barang fisik.
 */
export function ProductStockField({ stock, onChange }: ProductStockFieldProps) {
  return (
    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
      <label htmlFor="stock" className="block text-xs font-bold text-slate-800 mb-1.5">
        Kuantitas Stok Gudang
      </label>
      <input
        id="stock"
        name="stock"
        type="text"
        inputMode="numeric"
        value={stock}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        className="w-full h-11 px-4 rounded-lg text-xs sm:text-sm text-slate-800 bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] outline-none transition-all"
      />
      <p className="text-[11px] text-slate-500 mt-1">
        Jumlah unit fisik yang tersedia di inventaris gudang Anda saat ini.
      </p>
    </div>
  );
}

