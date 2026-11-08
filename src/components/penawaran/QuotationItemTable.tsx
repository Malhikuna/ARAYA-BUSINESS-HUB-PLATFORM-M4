"use client";

import React from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { ProductItem } from "@/types/product";
import { QuotationFormItem } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";

export interface QuotationItemTableProps {
  items: QuotationFormItem[];
  availableProducts: ProductItem[];
  notes: string;
  totalAmount: number;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onProductChange: (index: number, productId: string) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onNotesChange: (notes: string) => void;
}

/**
 * Tabel dinamis input baris produk/jasa pada form penawaran beserta catatan operasional dan grand total.
 * Sesuai desain Figma M4-US2 (PRD UC-03, BRD BRQ-04).
 */
export function QuotationItemTable({
  items,
  availableProducts,
  notes,
  totalAmount,
  onAddItem,
  onRemoveItem,
  onProductChange,
  onQuantityChange,
  onNotesChange,
}: QuotationItemTableProps) {
  return (
    <div className="space-y-4">
      {/* Header Item Penawaran */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-slate-900">Item penawaran</h3>
        <span className="text-[11px] text-slate-400 font-medium">Mata uang: IDR (Rp)</span>
      </div>

      {/* Tabel Item Penawaran */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f4f7fb] text-slate-700 font-semibold border-b border-slate-200/80">
                <th scope="col" className="px-4 py-3">Produk/jasa</th>
                <th scope="col" className="px-4 py-3 text-center w-28">Jumlah</th>
                <th scope="col" className="px-4 py-3 text-right leading-tight">
                  Harga<br className="hidden sm:inline" /> satuan
                </th>
                <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                <th scope="col" className="px-3 py-3 w-12 text-center">
                  <span className="sr-only">Hapus</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">Belum ada item penawaran.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Klik &quot;Tambah item&quot; di bawah untuk menambahkan produk atau jasa ke penawaran ini.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Dropdown Pilih Produk/Jasa dengan Chevron custom sesuai Figma */}
                    <td className="px-4 py-3 min-w-55">
                      <div className="relative">
                        <select
                          aria-label={`Pilih produk atau jasa baris ${idx + 1}`}
                          value={row.product_service_id}
                          onChange={(e) => onProductChange(idx, e.target.value)}
                          className="w-full h-9.5 pl-3 pr-8 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium appearance-none focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all cursor-pointer"
                        >
                          <option value="">Pilih item produk/jasa...</option>
                          {availableProducts.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={p.status === "Nonaktif"}
                            >
                              {p.name} ({p.category}){p.status === "Nonaktif" ? " - Nonaktif" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Input Kuantitas */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        aria-label={`Jumlah kuantitas item baris ${idx + 1}`}
                        value={row.quantity === 0 ? "" : row.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            onQuantityChange(idx, 0);
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed)) {
                              onQuantityChange(idx, Math.max(0, parsed));
                            }
                          }
                        }}
                        onBlur={() => {
                          if (!row.quantity || row.quantity < 1) {
                            onQuantityChange(idx, 1);
                          }
                        }}
                        className="w-20 h-9.5 px-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all"
                      />
                    </td>

                    {/* Harga Satuan */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                      {formatRupiah(row.unit_price)}
                    </td>

                    {/* Subtotal Baris */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(row.subtotal)}
                    </td>

                    {/* Tombol Hapus Baris */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        title="Hapus baris item"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                        aria-label="Hapus baris item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tombol Tambah Item */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#19376d] hover:text-[#122852] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah item</span>
          </button>
          <span className="text-[11px] text-slate-400 font-medium">
            {items.length} jenis item terdaftar
          </span>
        </div>
      </div>

      {/* Box Catatan Operasional & Grand Total Sesuai Figma Prototype */}
      <div className="bg-[#f0f4fa] rounded-2xl p-4 sm:p-5 space-y-2">
        <label htmlFor="notes" className="block text-xs font-bold text-slate-900">
          Catatan operasional
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Harga belum termasuk bea materai fisik jika diperlukan legalitas basah."
            className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] transition-all"
          />
          <div className="flex items-center sm:justify-end gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-semibold text-slate-600">Total</span>
            <span className="text-xl sm:text-2xl font-heading font-bold text-[#19376d]">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

