"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { QuotationFormHeader } from "@/components/penawaran/QuotationFormHeader";
import { QuotationValidationBanner } from "@/components/penawaran/QuotationValidationBanner";
import { useFreshForm } from "@/lib/use-fresh-form";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { formatRupiah } from "@/lib/format";
import { QuotationFromPermintaanCard } from "@/components/penawaran/QuotationFromPermintaanCard";
import { QuotationRequiresPermintaanNotice } from "@/components/penawaran/QuotationRequiresPermintaanNotice";
import { QuotationCustomerFields } from "@/components/penawaran/QuotationCustomerFields";
import { QuotationItemTable } from "@/components/penawaran/QuotationItemTable";
import { QuotationNotesAndTotalCard } from "@/components/penawaran/QuotationNotesAndTotalCard";
import { QuotationSummarySidebar } from "@/components/penawaran/QuotationSummarySidebar";
import { Quotation } from "@/types/quotation";
import { Customer } from "@/types/customer";
import { ProductItem } from "@/types/product";
import { PermintaanItem } from "@/types/permintaan";
import { initialCustomers, getStoredCustomers } from "@/lib/data/mock-customers";
import { initialProducts, getStoredProducts, syncProductsFromDatabase } from "@/lib/data/mock-products";
import { getStoredPermintaan, updatePermintaanStatus } from "@/lib/data/mock-permintaan";
import { validateQuotationForm } from "@/lib/quotation-form-validation";
import { useQuotationItems } from "@/lib/use-quotation-items";
import {
  saveNewQuotationToStorage,
  generateQuotationNumberForPermintaan,
  getTodayDateStr,
  calculateValidUntil,
} from "@/lib/data/mock-quotations";

function TambahPenawaranForm({
  permintaanData,
  onSaved,
}: {
  permintaanData: PermintaanItem;
  onSaved: (targetUrl: string) => void;
}) {
  // Master Data Pelanggan & Produk
  const [customers] = useState<Customer[]>(() => {
    try {
      const stored = getStoredCustomers();
      const parsed: Customer[] = typeof stored === "string" ? JSON.parse(stored) : stored;
      return Array.isArray(parsed) && parsed.length > 0
        ? [...initialCustomers, ...parsed.filter((p) => !initialCustomers.some((i) => i.id === p.id))]
        : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const parsed: ProductItem[] = JSON.parse(getStoredProducts());
      const merged = Array.isArray(parsed) && parsed.length > 0
        ? [...parsed, ...initialProducts.filter((i) => !parsed.some((p) => p.id === i.id))]
        : initialProducts;
      return merged.filter((p) => p.category === "Jasa");
    } catch {
      return initialProducts.filter((p) => p.category === "Jasa");
    }
  });

  useEffect(() => {
    syncProductsFromDatabase().then((dbItems) => {
      if (dbItems.length > 0) setProducts(dbItems.filter((p) => p.category === "Jasa"));
    });
  }, []);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => permintaanData.customerId || "");
  const [quotationNumber] = useState<string>(() =>
    generateQuotationNumberForPermintaan(permintaanData.id)
  );
  const lastAutoDateRef = useRef<string>(getTodayDateStr());
  const [quotationDate, setQuotationDate] = useState<string>(() => getTodayDateStr());
  const [validUntil, setValidUntil] = useState<string>(() => calculateValidUntil(getTodayDateStr(), 14));
  const [notes, setNotes] = useState<string>("");

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"error" | "warning">("error");
  const [actionHref, setActionHref] = useState<string | undefined>(undefined);
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleProductChange,
    handleDescriptionChange,
    handleQuantityChange,
    subtotal,
    totalAmount,
  } = useQuotationItems(permintaanData, products, clearError);

  // Peringatan otomatis jika permintaan sudah pernah dibuatkan penawaran (BR-13)
  const isAlreadyOffered = permintaanData.status === "Sudah ditawarkan";
  const offeredWarning = useMemo(() => {
    if (isAlreadyOffered) {
      const existingQuo =
        permintaanData.quotationNumber ||
        generateQuotationNumberForPermintaan(permintaanData.id);
      return {
        message: `Permintaan ${permintaanData.id} sudah memiliki penawaran resmi (${existingQuo}). Sesuai aturan BR-13, satu permintaan hanya boleh memiliki satu penawaran.`,
        type: "error" as const,
        actionHref: `/penawaran/lihat/${existingQuo}`,
        actionLabel: `Lihat penawaran ${existingQuo}`,
      };
    }
    return null;
  }, [isAlreadyOffered, permintaanData]);

  const activeBanner = useMemo(() => {
    if (errorMessage) {
      return {
        message: errorMessage,
        type: bannerType,
        actionHref,
        actionLabel,
      };
    }
    return offeredWarning;
  }, [errorMessage, bannerType, actionHref, actionLabel, offeredWarning]);

  // Sinkronisasi pergantian hari (midnight rollover) selama user belum mengubah tanggal secara manual
  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayDateStr();
      if (today !== lastAutoDateRef.current) {
        const previousAutoDate = lastAutoDateRef.current;
        lastAutoDateRef.current = today;
        setQuotationDate((prev) => (prev === previousAutoDate ? today : prev));
        setValidUntil((prev) =>
          prev === calculateValidUntil(previousAutoDate, 14)
            ? calculateValidUntil(today, 14)
            : prev
        );
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const currentCustomerName = useMemo(() => {
    if (permintaanData.customerName) return permintaanData.customerName;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    return cust?.name || "";
  }, [permintaanData, customers, selectedCustomerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validation = validateQuotationForm({
      permintaanData,
      selectedCustomerId,
      items,
      catalogProducts: products,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage);
      setBannerType(validation.bannerType);
      setActionHref(validation.actionHref);
      setActionLabel(validation.actionLabel);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrorMessage(null);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const selectedCust = customers.find((c) => c.id === selectedCustomerId);
    const newQuo: Quotation = {
      id: `QUO-${Date.now()}`,
      quotation_number: quotationNumber,
      customer_id: selectedCustomerId || permintaanData.customerId || "CUST-001",
      customer_name: currentCustomerName || selectedCust?.name || "Pelanggan",
      customer_phone: permintaanData.whatsapp || selectedCust?.phone,
      customer_email: selectedCust?.email,
      customer_address: selectedCust?.address,
      quotation_date: quotationDate,
      valid_until: validUntil,
      status: "DRAFT", // BR-06: status awal selalu Draf, "Terkirim" hanya setelah Kirim ke WhatsApp
      subtotal,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: totalAmount,
      notes,
      permintaan_id: permintaanData.id,
      permintaan_title: permintaanData.title,
      items: items.map((it, idx) => ({ ...it, id: `QI-${Date.now()}-${idx}` })),
      isNew: true,
      createdAt: new Date().toISOString(),
    };

    saveNewQuotationToStorage(newQuo);
    updatePermintaanStatus(permintaanData.id, "Sudah ditawarkan");

    setIsConfirmOpen(false);
    onSaved("/penawaran");
  };

  const backUrl = `/permintaan/lihat/${permintaanData.id}`;
  const backLabel = `Kembali ke permintaan ${permintaanData.id}`;
  const breadcrumbItems = [
    { label: "Permintaan", href: "/permintaan" },
    { label: permintaanData.id, href: `/permintaan/lihat/${permintaanData.id}` },
    { label: "Buat penawaran" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb items={breadcrumbItems} />
      <BackLink href={backUrl} label={backLabel} />

      <QuotationFormHeader
        isError={Boolean(hasAttemptedSubmit && activeBanner?.type === "error")}
        permintaanId={permintaanData.id}
      />

      <QuotationValidationBanner
        message={activeBanner?.message || null}
        type={activeBanner?.type || "error"}
        actionHref={activeBanner?.actionHref}
        actionLabel={activeBanner?.actionLabel}
        onDismiss={() => setErrorMessage(null)}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <QuotationFromPermintaanCard permintaan={permintaanData} />

            <QuotationCustomerFields
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              quotationNumber={quotationNumber}
              quotationDate={quotationDate}
              validUntil={validUntil}
              hasPermintaan
              onCustomerChange={(id) => { setSelectedCustomerId(id); setErrorMessage(null); }}
              onDateChange={(val) => {
                setQuotationDate(val);
                if (val && (!validUntil || validUntil < val)) setValidUntil(calculateValidUntil(val, 14));
              }}
              onValidUntilChange={setValidUntil}
            />

            <QuotationItemTable
              items={items}
              availableProducts={products}
              hasAttemptedSubmit={hasAttemptedSubmit}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onProductChange={handleProductChange}
              onDescriptionChange={handleDescriptionChange}
              onQuantityChange={handleQuantityChange}
            />

            <QuotationNotesAndTotalCard
              notes={notes}
              subtotal={subtotal}
              totalAmount={totalAmount}
              onNotesChange={setNotes}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href={backUrl}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isAlreadyOffered}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-sm ${
                  isAlreadyOffered
                    ? "bg-slate-400 cursor-not-allowed opacity-75"
                    : "bg-[#19376d] hover:bg-[#142c57] cursor-pointer"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <QuotationSummarySidebar
              quotationNumber={quotationNumber}
              customerName={currentCustomerName}
              itemsCount={items.length}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </form>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Simpan dokumen penawaran?"
        subtitle="Konfirmasi pembuatan penawaran harga baru"
        description="Penawaran akan disimpan dengan status awal Draf dan status permintaan terkait berubah menjadi Sudah ditawarkan. Anda masih dapat meninjau dokumen sebelum mengirim ke WhatsApp customer."
        confirmLabel="Ya, simpan penawaran"
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Nomor penawaran</span>
            <span className="font-mono font-bold text-slate-900">{quotationNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Referensi permintaan</span>
            <span className="font-mono font-semibold text-[#19376d]">{permintaanData.id}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Customer</span>
            <span className="font-semibold text-slate-800 truncate">{currentCustomerName || "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Jumlah item jasa</span>
            <span className="font-semibold text-slate-800">{items.length} layanan</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-200/80">
            <span className="font-semibold text-slate-700">Total penawaran</span>
            <span className="font-heading font-bold text-[#19376d]">{formatRupiah(totalAmount)}</span>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}

function TambahPenawaranGate({ onSaved }: { onSaved: (targetUrl: string) => void }) {
  const searchParams = useSearchParams();
  const fromPermintaan =
    searchParams?.get("fromPermintaan") ||
    searchParams?.get("permintaan_id") ||
    searchParams?.get("request_id") ||
    "";

  const permintaanData = useMemo<PermintaanItem | null>(() => {
    if (!fromPermintaan) return null;
    const list = getStoredPermintaan();
    return list.find((item) => item.id.toLowerCase() === fromPermintaan.toLowerCase()) || null;
  }, [fromPermintaan]);

  if (!fromPermintaan) return <QuotationRequiresPermintaanNotice />;

  if (!permintaanData) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">
            Permintaan tidak ditemukan
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Permintaan dengan kode <span className="font-mono font-semibold text-slate-700">{fromPermintaan}</span> tidak ditemukan. Silakan pilih permintaan valid dari daftar permintaan.
          </p>
        </div>
        <Link
          href="/permintaan"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          Kembali ke daftar permintaan
        </Link>
      </div>
    );
  }

  return <TambahPenawaranForm permintaanData={permintaanData} onSaved={onSaved} />;
}

export default function TambahPenawaranPage() {
  const { formKey, leaveForm } = useFreshForm();
  return (
    <Suspense fallback={<div className="p-12 text-xs text-slate-500 text-center">Memuat formulir penawaran...</div>}>
      <TambahPenawaranGate key={formKey} onSaved={(targetUrl) => leaveForm(targetUrl)} />
    </Suspense>
  );
}
