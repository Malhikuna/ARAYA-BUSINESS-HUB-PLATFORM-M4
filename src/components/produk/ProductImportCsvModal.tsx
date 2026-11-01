"use client";

import React, { useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { ProductItem } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { parseProductCsvContent } from "@/lib/data/mock-products";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export interface ProductImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  onImportItems: (items: Omit<ProductItem, "id" | "createdAt">[]) => void;
}

export function ProductImportCsvModal({
  open,
  onClose,
  onImportItems,
}: ProductImportCsvModalProps) {
  const [importedFileName, setImportedFileName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedImportItems, setParsedImportItems] = useState<Omit<ProductItem, "id" | "createdAt">[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModalState = () => {
    setImportedFileName("");
    setImportError(null);
    setParsedImportItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImportedFileName("");
      setParsedImportItems([]);
      setImportError("Silakan pilih berkas CSV terlebih dahulu.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportedFileName(file.name);
      setParsedImportItems([]);
      setImportError("Format berkas tidak didukung. Harap unggah berkas dengan format .csv.");
      return;
    }

    setImportedFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const { items, error } = parseProductCsvContent(text);
        setParsedImportItems(items);
        setImportError(error);
      } catch {
        setImportError("Gagal membaca berkas CSV. Periksa kembali struktur data berkas.");
        setParsedImportItems([]);
      }
    };
    reader.onerror = () => {
      setImportError("Terjadi kesalahan saat membaca berkas CSV.");
      setParsedImportItems([]);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!importedFileName) {
      setImportError("Silakan pilih berkas CSV terlebih dahulu sebelum mengimpor data.");
      return;
    }
    if (!importedFileName.toLowerCase().endsWith(".csv")) {
      setImportError("Format berkas tidak didukung. Harap unggah berkas dengan format .csv.");
      return;
    }
    if (parsedImportItems.length === 0) {
      setImportError("Berkas CSV tidak memiliki baris data produk atau jasa yang dapat diimpor.");
      return;
    }
    const itemsToImport = parsedImportItems;
    resetModalState();
    onImportItems(itemsToImport);
  };

  return (
    <ConfirmationModal
      open={open}
      title="Impor data produk/jasa"
      subtitle="Unggah berkas CSV katalog produk dan jasa"
      description="Pastikan format berkas berekstensi .csv dengan susunan kolom: Nama, Kategori (Produk/Jasa), Harga, dan Deskripsi."
      confirmLabel="Impor ke katalog"
      variant="primary"
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <div className="space-y-3">
        {importError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
            <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold block text-rose-800">Peringatan</span>
              <span className="text-[11px] leading-relaxed text-rose-700">{importError}</span>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="csv-import-input" className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Pilih berkas CSV <span className="text-rose-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            id="csv-import-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#e6eef8] file:text-[#19376d] hover:file:bg-[#d8e5f5] cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {importedFileName
              ? `Berkas dipilih: ${importedFileName} (${parsedImportItems.length} baris data ditemukan)`
              : "Hanya menerima berkas berformat .csv dengan pemisah koma (,) atau titik koma (;)."}
          </p>
        </div>

        {parsedImportItems.length > 0 && (
          <div className="pt-2.5 border-t border-slate-200/80 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pratinjau {parsedImportItems.length} item siap impor:
            </span>
            {parsedImportItems.map((item) => (
              <div key={item.sku} className="flex items-start justify-between gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{item.sku} | {item.category} | {item.status}</div>
                </div>
                <div className="font-bold text-[#19376d] shrink-0">{formatRupiah(item.price)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ConfirmationModal>
  );
}

