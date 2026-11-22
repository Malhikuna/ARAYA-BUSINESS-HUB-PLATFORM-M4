"use client";

import React, { useRef } from "react";
import { FileText, Calendar } from "lucide-react";
import { Customer } from "@/types/customer";
import { getTodayDateStr } from "@/lib/data/mock-quotations";

export interface QuotationCustomerFieldsProps {
  customers: Customer[];
  selectedCustomerId: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  hasPermintaan?: boolean;
  onCustomerChange: (customerId: string) => void;
  onDateChange: (date: string) => void;
  onValidUntilChange: (date: string) => void;
}

/**
 * Card Informasi Dokumen Penawaran:
 * Nomor penawaran otomatis, tanggal terbit, dan tanggal kedaluwarsa/berlaku sampai.
 */
export function QuotationCustomerFields({
  customers,
  selectedCustomerId,
  quotationNumber,
  quotationDate,
  validUntil,
  hasPermintaan = false,
  onCustomerChange,
  onDateChange,
  onValidUntilChange,
}: QuotationCustomerFieldsProps) {
  const quoteDateRef = useRef<HTMLInputElement>(null);
  const validUntilRef = useRef<HTMLInputElement>(null);
  const todayStr = getTodayDateStr();

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileText className="w-4 h-4 text-[#19376d]" />
        <h2 className="text-sm font-bold text-slate-900">Informasi dokumen penawaran</h2>
      </div>

      <div className="space-y-4">
        {!hasPermintaan && (
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
              <option value="">Pilih pelanggan...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Pilih entitas penerima dokumen penawaran harga resmi.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="quote-number" className="block text-xs font-bold text-slate-900">
              Nomor penawaran
            </label>
            <div className="flex items-center justify-between h-10 px-3 rounded-xl bg-[#f0f4fa] border border-slate-200/90 text-xs font-mono font-bold text-[#19376d]">
              <span>{quotationNumber}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-sans font-semibold">
                Otomatis sistem
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quote-date" className="block text-xs font-bold text-slate-900">
              Tanggal penawaran <span className="text-red-500">*</span>
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => openDatePicker(quoteDateRef)}
            >
              <input
                ref={quoteDateRef}
                id="quote-date"
                type="date"
                required
                min={todayStr}
                value={quotationDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full h-10 pl-3 pr-9 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="valid-until" className="block text-xs font-bold text-slate-900">
              Berlaku sampai <span className="text-red-500">*</span>
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => openDatePicker(validUntilRef)}
            >
              <input
                ref={validUntilRef}
                id="valid-until"
                type="date"
                required
                min={quotationDate || todayStr}
                value={validUntil}
                onChange={(e) => onValidUntilChange(e.target.value)}
                className="w-full h-10 pl-3 pr-9 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#19376d]/20 focus:border-[#19376d] outline-none transition-all cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400">Default 14 hari, dapat disesuaikan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
