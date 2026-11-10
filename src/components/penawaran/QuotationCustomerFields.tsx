"use client";

import React from "react";
import { Customer } from "@/types/customer";

export interface QuotationCustomerFieldsProps {
  customers: Customer[];
  selectedCustomerId: string;
  quotationNumber: string;
  quotationDate: string;
  onCustomerChange: (customerId: string) => void;
  onDateChange: (date: string) => void;
}

/**
 * Bagian input data pelanggan, nomor penawaran otomatis, dan tanggal penawaran.
 */
export function QuotationCustomerFields({
  customers,
  selectedCustomerId,
  quotationNumber,
  quotationDate,
  onCustomerChange,
  onDateChange,
}: QuotationCustomerFieldsProps) {
  return (
    <div className="space-y-5">
      {/* Field Pelanggan */}
      <div className="space-y-1.5">
        <label htmlFor="customer" className="block text-xs font-bold text-slate-900">
          Pelanggan <span className="text-red-500">*</span>
        </label>
        <select
          id="customer"
          required
          value={selectedCustomerId}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all cursor-pointer"
        >
          <option value="">Pilih pelanggan</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Pilih entitas penerima penawaran harga resmi.
        </p>
      </div>

      {/* Grid Nomor Penawaran & Tanggal Penawaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="quote-number" className="block text-xs font-bold text-slate-900">
            Nomor penawaran
          </label>
          <input
            id="quote-number"
            type="text"
            readOnly
            value={quotationNumber}
            className="w-full h-10 px-3 rounded-xl bg-[#eef4ff] border border-blue-200/60 text-xs font-bold text-[#19376d] outline-none cursor-default"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="quote-date" className="block text-xs font-bold text-slate-900">
            Tanggal penawaran
          </label>
          <input
            id="quote-date"
            type="date"
            required
            value={quotationDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}

