import React from "react";

export interface ProductStockFieldProps {
  stock: string;
  onChange: (value: string) => void;
}

/**
 * Bidang input kuantitas stok gudang khusus produk barang fisik.
 */
export function ProductStockField({ stock, onChange }: ProductStockFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 8);
    // Hapus angka 0 di depan jika diikuti angka lain (mis. "01" -> "1", "00" -> "0")
    const normalized = rawDigits.replace(/^0+(?=\d)/, "");
    onChange(normalized);
  };

  const handleBlur = () => {
    if (!stock.trim()) {
      onChange("0");
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === "0") {
      e.target.select();
    }
  };

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
        placeholder="0"
        value={stock}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full h-11 px-4 rounded-lg text-xs sm:text-sm text-slate-800 bg-white border border-slate-300 focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] outline-none transition-all"
      />
      <p className="text-[11px] text-slate-500 mt-1">
        Jumlah unit fisik yang tersedia di inventaris gudang Anda saat ini.
      </p>
    </div>
  );
}

