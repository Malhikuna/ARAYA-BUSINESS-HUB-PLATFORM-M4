"use client";

import React from "react";
import { Wrench, Trash2, ChevronDown, Plus } from "lucide-react";
import { ProductItem } from "@/types/product";
import { QuotationFormItem } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";

export interface QuotationItemTableProps {
  items: QuotationFormItem[];
  availableProducts: ProductItem[];
  hasAttemptedSubmit?: boolean;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onProductChange: (index: number, productId: string) => void;
  onDescriptionChange: (index: number, description: string) => void;
  onQuantityChange: (index: number, quantity: number) => void;
}

/**
 * Card Rincian Jasa Penawaran:
 * Tabel interaktif rincian jasa, satuan, kuantitas, harga, dan subtotal.
 * Menghindari teks terpotong (seperti 'Pend' atau 'Pilih ja') dan mendukung indikator error inline yang rapi.
 */
export function QuotationItemTable({
  items,
  availableProducts,
  hasAttemptedSubmit = false,
  onAddItem,
  onRemoveItem,
  onProductChange,
  onDescriptionChange,
  onQuantityChange,
}: QuotationItemTableProps) {
  // BR-13 & UC-04: Dropdown penawaran hanya menampilkan Jasa berstatus Aktif
  const activeServices = availableProducts.filter(
    (p) => p.category === "Jasa" && p.status === "Aktif"
  );
  const showEmptyError = hasAttemptedSubmit && items.length === 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-4">
      {/* Header Card */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#19376d]" />
          <h2 className="text-sm font-bold text-slate-900">Rincian jasa penawaran</h2>
        </div>
        <span className="text-xs text-slate-400 font-normal">
          Hanya jasa aktif yang dapat dipilih (BR-13)
        </span>
      </div>

      {/* Tabel Rincian Jasa */}
      <div
        className={`border rounded-2xl overflow-hidden bg-white shadow-2xs ${
          showEmptyError ? "border-red-400 ring-1 ring-red-400" : "border-slate-200/90"
        }`}
      >
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-160 sm:min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f4f7fb] text-slate-700 font-semibold border-b border-slate-200/80">
                <th scope="col" className="px-4 py-3">Jasa</th>
                <th scope="col" className="px-4 py-3 text-center w-28">Satuan</th>
                <th scope="col" className="px-4 py-3 text-center w-28">Jumlah</th>
                <th scope="col" className="px-4 py-3 text-right">Harga satuan</th>
                <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                <th scope="col" className="px-3 py-3 w-12 text-center">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <p className={`text-xs font-semibold ${showEmptyError ? "text-red-600" : "text-slate-600"}`}>
                      {showEmptyError
                        ? "Minimal 1 item jasa aktif wajib ditambahkan sebelum menyimpan."
                        : "Belum ada rincian jasa penawaran."}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Klik &quot;Tambah jasa&quot; di bawah untuk menambahkan item jasa aktif.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const isServiceUnselected = !row.product_service_id;
                  const isQtyInvalid = row.quantity <= 0;
                  const showErrorService = hasAttemptedSubmit && isServiceUnselected;
                  const showErrorQty = hasAttemptedSubmit && isQtyInvalid;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors align-top">
                      {/* 1. Kolom Jasa: Dropdown selalu bisa diganti langsung tanpa perlu hapus baris */}
                      <td className="px-4 py-3.5 min-w-70 sm:min-w-85">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <select
                              aria-label={`Pilih jasa baris ${idx + 1}`}
                              value={row.product_service_id}
                              onChange={(e) => onProductChange(idx, e.target.value)}
                              className={`w-full h-9.5 pl-3 pr-8 rounded-xl border text-xs font-medium appearance-none focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all cursor-pointer ${
                                showErrorService
                                  ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-slate-800"
                                  : row.product_service_id
                                  ? "border-blue-200 bg-[#eef4ff]/60 text-[#19376d] font-semibold"
                                  : "border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              <option value="">Pilih jasa aktif...</option>
                              {row.product_service_id &&
                                !activeServices.some((p) => p.id === row.product_service_id) && (
                                  <option value={row.product_service_id}>
                                    {row.name || row.product_service_id}
                                  </option>
                                )}
                              {activeServices.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          {row.product_service_id && (
                            <input
                              type="text"
                              value={row.description || ""}
                              onChange={(e) => onDescriptionChange(idx, e.target.value)}
                              placeholder="Tambahkan deskripsi atau rincian layanan..."
                              className="w-full text-xs text-slate-500 placeholder:text-slate-400 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-[#19376d] pb-0.5 transition-all"
                            />
                          )}
                          {showErrorService && (
                            <span className="text-[11px] text-red-600 font-medium block">
                              Pilih jasa.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Kolom Satuan */}
                      <td className="px-4 py-3.5 text-center">
                        {row.product_service_id ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eef4ff] text-[#19376d] whitespace-nowrap">
                            {row.unit || "per bulan"}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#f0f4fa] text-slate-400 whitespace-nowrap">
                            -
                          </span>
                        )}
                      </td>

                      {/* 3. Kolom Jumlah */}
                      <td className="px-4 py-3.5 text-center">
                        {row.product_service_id ? (
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min={0}
                              max={9999}
                              aria-label={`Jumlah jasa baris ${idx + 1}`}
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
                              placeholder="0"
                              className={`w-18 h-9.5 text-center rounded-xl bg-white border text-xs font-bold text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all ${
                                showErrorQty ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : "border-slate-200"
                              }`}
                            />
                            {showErrorQty && (
                              <span className="text-[11px] text-red-600 font-medium mt-1 whitespace-nowrap">
                                Isi jumlah minimal 1.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#f0f4fa] text-slate-400 whitespace-nowrap">
                            -
                          </span>
                        )}
                      </td>

                      {/* 4. Kolom Harga Satuan */}
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                        {row.product_service_id ? formatRupiah(row.unit_price) : "Rp 0"}
                      </td>

                      {/* 5. Kolom Subtotal */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {row.product_service_id ? formatRupiah(row.subtotal) : "Rp 0"}
                      </td>

                      {/* 6. Kolom Hapus */}
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          title="Hapus baris jasa"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                          aria-label="Hapus baris jasa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tombol Tambah Jasa */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#eef4ff] hover:bg-[#dbeafe] text-[#19376d] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah jasa</span>
          </button>
          <span className="text-[11px] text-slate-400 font-medium">
            {items.length} item jasa tercantum
          </span>
        </div>
      </div>
    </div>
  );
}
