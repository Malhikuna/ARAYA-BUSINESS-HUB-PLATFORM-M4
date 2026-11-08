"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
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
        <span className="text-[11px] text-slate-400">Mata uang: IDR (Rp)</span>
      </div>

      {/* Tabel Item Penawaran */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f0f4fa] text-slate-700 font-semibold border-b border-slate-200/80">
                <th scope="col" className="px-4 py-3">Produk/jasa</th>
                <th scope="col" className="px-4 py-3 text-center w-28">Jumlah</th>
                <th scope="col" className="px-4 py-3 text-right">Harga satuan</th>
                <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                <th scope="col" className="px-3 py-3 w-10 text-center"><span className="sr-only">Hapus</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  {/* Dropdown Pilih Produk/Jasa */}
                  <td className="px-4 py-3 min-w-[200px]">
                    <select
                      value={row.product_service_id}
                      onChange={(e) => onProductChange(idx, e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#19376d] outline-none"
                    >
                      <option value="">Pilih item...</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Input Kuantitas */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={row.quantity}
                      onChange={(e) => onQuantityChange(idx, Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 h-9 px-2 text-center rounded-lg bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#19376d] outline-none"
                    />
                  </td>

                  {/* Harga Satuan */}
                  <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatRupiah(row.unit_price)}
                  </td>

                  {/* Subtotal Baris */}
                  <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(row.subtotal)}
                  </td>

                  {/* Tombol Hapus Baris */}
                  <td className="px-3 py-3 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        title="Hapus baris item"
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Tombol Tambah Item */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#19376d] hover:text-[#122852] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah item</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {items.length} jenis item terdaftar
          </span>
        </div>
      </div>

      {/* Box Catatan Operasional & Grand Total */}
      <div className="bg-[#f0f4fa] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-md space-y-1">
          <label htmlFor="notes" className="block text-xs font-bold text-slate-900">
            Catatan operasional
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Contoh: Harga belum termasuk bea materai fisik..."
            className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#19376d]"
          />
        </div>

        <div className="text-right sm:text-right w-full sm:w-auto self-end sm:self-center">
          <div className="flex items-baseline justify-end gap-3">
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
