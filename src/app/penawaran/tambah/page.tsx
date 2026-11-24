"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { QuotationFormHeader } from "@/components/penawaran/QuotationFormHeader";
import { QuotationValidationBanner } from "@/components/penawaran/QuotationValidationBanner";
import { useFreshForm } from "@/lib/use-fresh-form";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { QuotationSaveConfirmModal } from "@/components/penawaran/QuotationSaveConfirmModal";
import { QuotationFromPermintaanCard } from "@/components/penawaran/QuotationFromPermintaanCard";
import { QuotationRequiresPermintaanNotice } from "@/components/penawaran/QuotationRequiresPermintaanNotice";
import { QuotationCustomerFields } from "@/components/penawaran/QuotationCustomerFields";
import { QuotationItemTable } from "@/components/penawaran/QuotationItemTable";
import { QuotationNotesAndTotalCard } from "@/components/penawaran/QuotationNotesAndTotalCard";
import { QuotationSummarySidebar } from "@/components/penawaran/QuotationSummarySidebar";
import { Customer } from "@/types/customer";
import { ProductItem } from "@/types/product";
import { PermintaanItem } from "@/types/permintaan";
import { syncProductsFromDatabase } from "@/lib/data/mock-products";
import { getStoredPermintaan } from "@/lib/data/mock-permintaan";
import { validateQuotationForm } from "@/lib/quotation-form-validation";
import { useQuotationItems } from "@/lib/use-quotation-items";
import {
  generateQuotationNumberForPermintaan,
  getTodayDateStr,
  calculateValidUntil,
} from "@/lib/data/mock-quotations";
import {
  loadInitialActiveServices,
  loadInitialQuotationCustomers,
} from "@/lib/quotation-workflow-helpers";
import {
  calculateLinePpnRupiah,
  createQuotationViaApi,
  DEFAULT_QUOTATION_PPN_RATE,
  fetchPartnerActiveServices,
  fetchServiceRequestPrefill,
  filterActivePartnerServices,
  formatRequestDisplayCode,
  isUuid,
} from "@/lib/data/quotation-workflow-api";

function TambahPenawaranForm({
  permintaanData,
  onSaved,
}: {
  permintaanData: PermintaanItem;
  onSaved: (targetUrl: string) => void;
}) {
  // Master Data Pelanggan & Produk (terkunci khusus Jasa Aktif milik Partner)
  const [customers] = useState<Customer[]>(loadInitialQuotationCustomers);
  const [products, setProducts] = useState<ProductItem[]>(loadInitialActiveServices);

  useEffect(() => {
    let active = true;
    fetchPartnerActiveServices().then((partnerServices) => {
      if (!active) return;
      if (partnerServices.length > 0) {
        setProducts(partnerServices);
        return;
      }
      syncProductsFromDatabase().then((dbItems) => {
        if (active && dbItems.length > 0) {
          setProducts(filterActivePartnerServices(dbItems));
        }
      });
    });
    return () => {
      active = false;
    };
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
  } = useQuotationItems(permintaanData, products, clearError);

  const taxRate = DEFAULT_QUOTATION_PPN_RATE;
  const taxAmount = useMemo(
    () => items.reduce((sum, it) => sum + calculateLinePpnRupiah(it.subtotal, taxRate), 0),
    [items, taxRate]
  );
  const totalAmount = subtotal + taxAmount;

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

  const handleConfirmSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      const result = await createQuotationViaApi({
        permintaan: permintaanData,
        customerId: selectedCustomerId || permintaanData.customerId || "CUST-001",
        customerName: currentCustomerName || selectedCust?.name || "Pelanggan",
        customerPhone: permintaanData.whatsapp || selectedCust?.phone,
        customerEmail: selectedCust?.email,
        customerAddress: selectedCust?.address,
        quotationNumber,
        quotationDate,
        validUntil,
        notes,
        items,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
      });

      setIsConfirmOpen(false);
      if (!result.ok) {
        setErrorMessage(result.message);
        setBannerType("error");
        setActionHref(undefined);
        setActionLabel(undefined);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      onSaved("/penawaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRequestCode = formatRequestDisplayCode(permintaanData.id);
  const backUrl = `/permintaan/lihat/${permintaanData.id}`;
  const backLabel = `Kembali ke permintaan ${displayRequestCode}`;
  const breadcrumbItems = [
    { label: "Permintaan", href: "/permintaan" },
    { label: displayRequestCode, href: `/permintaan/lihat/${permintaanData.id}` },
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

      <QuotationSaveConfirmModal
        open={isConfirmOpen}
        isSubmitting={isSubmitting}
        quotationNumber={quotationNumber}
        requestCode={displayRequestCode}
        customerName={currentCustomerName}
        itemsCount={items.length}
        totalAmount={totalAmount}
        onConfirm={() => void handleConfirmSave()}
        onCancel={() => !isSubmitting && setIsConfirmOpen(false)}
      />
    </div>
  );
}

function TambahPenawaranGate({ onSaved }: { onSaved: (targetUrl: string) => void }) {
  const searchParams = useSearchParams();
  const fromPermintaan =
    searchParams?.get("request_id") ||
    searchParams?.get("fromPermintaan") ||
    searchParams?.get("permintaan_id") ||
    "";

  const localPermintaan = useMemo<PermintaanItem | null>(() => {
    if (!fromPermintaan) return null;
    const list = getStoredPermintaan();
    return list.find((item) => item.id.toLowerCase() === fromPermintaan.toLowerCase()) || null;
  }, [fromPermintaan]);

  const [apiPermintaan, setApiPermintaan] = useState<PermintaanItem | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(() => isUuid(fromPermintaan));

  useEffect(() => {
    if (!isUuid(fromPermintaan)) return;
    let active = true;
    fetchServiceRequestPrefill(fromPermintaan)
      .then((found) => {
        if (active) setApiPermintaan(found);
      })
      .finally(() => {
        if (active) setIsLoadingApi(false);
      });
    return () => {
      active = false;
    };
  }, [fromPermintaan]);

  const permintaanData = apiPermintaan || localPermintaan;

  if (!fromPermintaan) return <QuotationRequiresPermintaanNotice />;
  if (isLoadingApi && !permintaanData) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat data permintaan jasa untuk prefill...</p>
      </div>
    );
  }
  if (!permintaanData) return <QuotationRequiresPermintaanNotice missingId={fromPermintaan} />;

  return <TambahPenawaranForm key={permintaanData.id} permintaanData={permintaanData} onSaved={onSaved} />;
}

export default function TambahPenawaranPage() {
  const { formKey, leaveForm } = useFreshForm();
  return (
    <Suspense fallback={<div className="p-12 text-xs text-slate-500 text-center">Memuat formulir penawaran...</div>}>
      <TambahPenawaranGate key={formKey} onSaved={(targetUrl) => leaveForm(targetUrl)} />
    </Suspense>
  );
}
