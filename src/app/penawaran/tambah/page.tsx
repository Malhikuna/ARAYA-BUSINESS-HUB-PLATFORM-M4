"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { QuotationFormHeader } from "@/components/penawaran/QuotationFormHeader";
import { QuotationValidationBanner } from "@/components/penawaran/QuotationValidationBanner";
import { getFallbackPermintaan } from "@/lib/data/permintaan-fallback";
import { useFreshForm } from "@/lib/use-fresh-form";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
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
import { findPermintaanById, updatePermintaanStatus } from "@/lib/data/mock-permintaan";
import { validateQuotationForm } from "@/lib/quotation-form-validation";
import { useQuotationItems } from "@/lib/use-quotation-items";
import {
  saveNewQuotationToStorage,
  generateNextQuotationNumber,
  getTodayDateStr,
  calculateValidUntil,
} from "@/lib/data/mock-quotations";

function TambahPenawaranForm({ onSaved }: { onSaved: (targetUrl: string) => void }) {
  const searchParams = useSearchParams();
  const fromPermintaan = searchParams?.get("fromPermintaan") || searchParams?.get("permintaan_id") || "";

  // Data rujukan permintaan layanan (jika ada)
  const permintaanData = useMemo<PermintaanItem | null>(() => {
    if (!fromPermintaan) return null;
    return findPermintaanById(fromPermintaan) || getFallbackPermintaan(fromPermintaan);
  }, [fromPermintaan]);

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => permintaanData?.customerId || "");
  const [quotationNumber] = useState<string>(() =>
    permintaanData?.id ? permintaanData.id.replace(/^PMT-/, "PNW-") : generateNextQuotationNumber()
  );
  const [quotationDate, setQuotationDate] = useState<string>(() => getTodayDateStr());
  const [validUntil, setValidUntil] = useState<string>(() => calculateValidUntil(getTodayDateStr(), 14));
  const [notes, setNotes] = useState<string>("");

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"error" | "warning">("error");
  const [actionHref, setActionHref] = useState<string | undefined>(undefined);
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);

  const clearError = useCallback(() => setErrorMessage(null), []);

  // Hook Items Penawaran
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

  // Peringatan otomatis jika permintaan sudah pernah dibuatkan penawaran (Case 1c / BR-13)
  const isAlreadyOffered = permintaanData?.status === "Sudah ditawarkan";
  const offeredWarning = useMemo(() => {
    if (isAlreadyOffered && permintaanData) {
      const existingQuo =
        permintaanData.quotationNumber ||
        `PNW-${permintaanData.id.replace(/^PMT-?/i, "")}`;
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

  // Sinkronisasi tanggal rollover
  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayDateStr();
      setQuotationDate((prev) => (prev ? prev : today));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentCustomerName = useMemo(() => {
    if (permintaanData) return permintaanData.customerName;
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

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);
    const newQuo: Quotation = {
      id: `QUO-${Date.now()}`,
      quotation_number: quotationNumber,
      customer_id: selectedCustomerId || permintaanData?.customerId || "CUST-001",
      customer_name: currentCustomerName || selectedCust?.name || "Pelanggan",
      customer_phone: permintaanData?.whatsapp || selectedCust?.phone,
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
      permintaan_id: permintaanData?.id,
      permintaan_title: permintaanData?.title,
      items: items.map((it, idx) => ({ ...it, id: `QI-${Date.now()}-${idx}` })),
      isNew: true,
      createdAt: new Date().toISOString(),
    };

    saveNewQuotationToStorage(newQuo);

    if (permintaanData?.id) {
      updatePermintaanStatus(permintaanData.id, "Sudah ditawarkan");
    }

    try {
      sessionStorage.setItem("araya_show_quotation_toast", "created");
      sessionStorage.setItem("araya_show_quotation_toast_number", newQuo.quotation_number);
    } catch {
      // ignore
    }

    onSaved("/penawaran");
  };

  const backUrl = permintaanData ? `/permintaan/lihat/${permintaanData.id}` : "/penawaran";
  const backLabel = permintaanData ? `Kembali ke permintaan ${permintaanData.id}` : "Kembali ke daftar penawaran";
  const breadcrumbItems = permintaanData
    ? [{ label: "Permintaan", href: "/permintaan" }, { label: permintaanData.id, href: `/permintaan/lihat/${permintaanData.id}` }, { label: "Buat penawaran" }]
    : [{ label: "Penawaran", href: "/penawaran" }, { label: "Tambah Penawaran" }];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb items={breadcrumbItems} />
      <BackLink href={backUrl} label={backLabel} />

      <QuotationFormHeader
        isError={Boolean(hasAttemptedSubmit && activeBanner?.type === "error")}
        permintaanId={permintaanData?.id}
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
            {permintaanData && <QuotationFromPermintaanCard permintaan={permintaanData} />}

            <QuotationCustomerFields
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              quotationNumber={quotationNumber}
              quotationDate={quotationDate}
              validUntil={validUntil}
              hasPermintaan={Boolean(permintaanData)}
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
    </div>
  );
}

function TambahPenawaranGate({ onSaved }: { onSaved: (targetUrl: string) => void }) {
  const searchParams = useSearchParams();
  const hasPermintaan = Boolean(searchParams?.get("fromPermintaan") || searchParams?.get("permintaan_id"));
  if (!hasPermintaan) return <QuotationRequiresPermintaanNotice />;
  return <TambahPenawaranForm onSaved={onSaved} />;
}

export default function TambahPenawaranPage() {
  const { formKey, leaveForm } = useFreshForm();
  return (
    <Suspense fallback={<div className="p-12 text-xs text-slate-500 text-center">Memuat formulir penawaran...</div>}>
      <TambahPenawaranGate key={formKey} onSaved={(targetUrl) => leaveForm(targetUrl)} />
    </Suspense>
  );
}
