import React from "react";
import { Quotation } from "@/types/quotation";
import { formatRupiah } from "@/lib/format";
import { formatTanggalIndo } from "@/lib/data/mock-quotations";

export interface QuotationPrintDocumentProps {
  quotation: Quotation;
}

/**
 * Komponen dokumen cetak resmi penawaran harga (Quotation).
 * Diformat khusus untuk lembar kertas standar A4 dengan kop surat, rincian item, dan lembar otorisasi.
 */
export function QuotationPrintDocument({ quotation }: QuotationPrintDocumentProps) {
  const isApproved = quotation.status === "APPROVED";
  const validUntilLabel = quotation.valid_until
    ? formatTanggalIndo(quotation.valid_until)
    : "14 hari sejak diterbitkan";

  return (
    <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-slate-900 font-sans p-8 print:p-4 text-xs leading-normal">
      {/* 1. KOP SURAT RESMI */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-[#19376d]">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-[#19376d]">
            ARAYA BUSINESS HUB
          </h1>
          <p className="text-[11px] font-semibold text-slate-700">
            Badan Pengembangan Usaha (BPU) Universitas Pasundan
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">
            Jl. Tamansari No. 6-8, Bandung, Jawa Barat 40116
            <br />
            Telepon: (022) 420-5945 | Surel: bpu@unpas.ac.id | www.araya.unpas.ac.id
          </p>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-[#19376d] text-white text-[11px] font-bold tracking-wider uppercase rounded-sm">
            Surat Penawaran
          </span>
          <p className="text-xs font-mono font-bold text-slate-900 mt-1">
            {quotation.quotation_number}
          </p>
          <p className="text-[10px] text-slate-500">
            Tanggal: {formatTanggalIndo(quotation.quotation_date)}
          </p>
          <p className="text-[10px] font-medium text-slate-700">
            Status:{" "}
            <span className={isApproved ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
              {isApproved ? "Disetujui" : "Menunggu Persetujuan"}
            </span>
          </p>
        </div>
      </div>

      {/* 2. INFORMASI DOKUMEN & PELANGGAN */}
      <div className="grid grid-cols-2 gap-6 my-5 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ditujukan Kepada:
          </span>
          <p className="text-sm font-bold text-slate-900">{quotation.customer_name}</p>
          {quotation.customer_phone && (
            <p className="text-[11px] text-slate-600 font-mono">
              Telp / WhatsApp: {quotation.customer_phone}
            </p>
          )}
          {quotation.customer_email && (
            <p className="text-[11px] text-slate-600">
              Email: {quotation.customer_email}
            </p>
          )}
          {quotation.customer_address && (
            <p className="text-[11px] text-slate-600 leading-snug pt-0.5">
              Alamat: {quotation.customer_address}
            </p>
          )}
        </div>

        <div className="space-y-1 text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ketentuan Dokumen:
          </span>
          <p className="text-[11px] text-slate-700">
            <strong className="text-slate-900">Masa Berlaku:</strong> Hingga {validUntilLabel}
          </p>
          <p className="text-[11px] text-slate-700">
            <strong className="text-slate-900">Mata Uang:</strong> Rupiah Indonesia (IDR)
          </p>
          <p className="text-[11px] text-slate-700">
            <strong className="text-slate-900">Metode Bayar:</strong> Virtual Account / Transfer Bank
          </p>
          <p className="text-[11px] text-slate-700">
            <strong className="text-slate-900">Kepatuhan Pajak:</strong> Standar PPN 11% (UU HPP)
          </p>
        </div>
      </div>

      {/* 3. TABEL ITEM RINCIAN */}
      <div className="my-4">
        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th scope="col" className="p-2.5 border-r border-slate-300 text-center w-10">No</th>
              <th scope="col" className="p-2.5 border-r border-slate-300">Deskripsi Item Produk / Layanan</th>
              <th scope="col" className="p-2.5 border-r border-slate-300 text-center w-24">Jumlah</th>
              <th scope="col" className="p-2.5 border-r border-slate-300 text-right w-36">Harga Satuan</th>
              <th scope="col" className="p-2.5 text-right w-40">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quotation.items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-slate-200">
                <td className="p-2.5 text-center font-mono border-r border-slate-200 text-slate-500">
                  {idx + 1}
                </td>
                <td className="p-2.5 border-r border-slate-200">
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  {item.description && (
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="p-2.5 text-center border-r border-slate-200 text-slate-800">
                  {item.quantity} {item.unit || "Unit"}
                </td>
                <td className="p-2.5 text-right font-mono border-r border-slate-200 text-slate-800">
                  {formatRupiah(item.unit_price)}
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                  {formatRupiah(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. TOTAL & CATATAN OPERASIONAL */}
      <div className="grid grid-cols-12 gap-6 my-4 items-start">
        <div className="col-span-7 space-y-2">
          {quotation.notes && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Catatan & Petunjuk Teknis:
              </span>
              <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                {quotation.notes}
              </p>
            </div>
          )}
          <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
            <p>1. Penawaran harga ini mengikat selama masa berlaku dokumen aktif.</p>
            <p>2. Tagihan resmi (Invoice) akan diterbitkan setelah penawaran disetujui.</p>
          </div>
        </div>

        <div className="col-span-5 border border-slate-300 rounded p-3 bg-slate-50 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Item:</span>
            <span className="font-mono">{formatRupiah(quotation.subtotal)}</span>
          </div>

          {quotation.discount_amount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Potongan Diskon:</span>
              <span className="font-mono text-emerald-700">
                - {formatRupiah(quotation.discount_amount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>PPN (11%):</span>
            <span className="font-mono">{formatRupiah(quotation.tax_amount)}</span>
          </div>

          <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-bold text-slate-900 text-sm">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-[#19376d]">
              {formatRupiah(quotation.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. LEMBAR OTORISASI / TANDA TANGAN */}
      <div className="grid grid-cols-2 gap-12 mt-10 pt-6 border-t border-slate-200 text-center">
        <div className="space-y-16">
          <div>
            <p className="text-[11px] text-slate-600 font-medium">Menyetujui & Menerima,</p>
            <p className="text-xs font-bold text-slate-900">Pihak Pelanggan</p>
          </div>
          <div className="border-t border-slate-400 w-48 mx-auto pt-1">
            <p className="text-xs font-bold text-slate-900">{quotation.customer_name}</p>
            <p className="text-[10px] text-slate-500">Tanda tangan & Stempel</p>
          </div>
        </div>

        <div className="space-y-16">
          <div>
            <p className="text-[11px] text-slate-600 font-medium">
              Bandung, {formatTanggalIndo(quotation.quotation_date)}
            </p>
            <p className="text-xs font-bold text-slate-900">Araya Business Hub — Modul Penjualan</p>
          </div>
          <div className="border-t border-slate-400 w-48 mx-auto pt-1">
            <p className="text-xs font-bold text-slate-900">Bagian Operasional Penjualan</p>
            <p className="text-[10px] text-slate-500">Otorisasi Resmi Sistem</p>
          </div>
        </div>
      </div>

      {/* 6. FOOTER */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
        Dokumen ini diterbitkan secara sah dan otomatis melalui Araya Business Hub Platform (Modul 4 Capstone PPL BPU Unpas).
      </div>
    </div>
  );
}

