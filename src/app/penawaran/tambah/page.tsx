"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { QuotationCustomerFields } from "@/components/penawaran/QuotationCustomerFields";
import { QuotationItemTable } from "@/components/penawaran/QuotationItemTable";
import { QuotationSummarySidebar } from "@/components/penawaran/QuotationSummarySidebar";
import { QuotationFormItem, Quotation } from "@/types/quotation";
import { Customer } from "@/types/customer";
import { ProductItem } from "@/types/product";
import { initialCustomers, getStoredCustomers } from "@/lib/data/mock-customers";
import { initialProducts } from "@/lib/data/mock-products";
import {
  saveNewQuotationToStorage,
  generateNextQuotationNumber,
} from "@/lib/data/mock-quotations";

/**
 * Halaman Pembuatan Penawaran Baru (Quotation).
 * Sesuai PRD M4-US2 & BRD (UC-03, BRQ-04).
 */
export default function TambahPenawaranPage() {
  const router = useRouter();

  // Master Data Pelanggan & Produk
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products] = useState<ProductItem[]>(initialProducts);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("CUST-001");
  const [quotationNumber, setQuotationNumber] = useState<string>("PNW-0006");
  const [quotationDate, setQuotationDate] = useState<string>("2026-10-24");
  const [notes, setNotes] = useState<string>(
    "Harga belum termasuk bea materai fisik jika diperlukan legalitas basah."
  );

  // Items State (Default sesuai desain screenshot)
  const [items, setItems] = useState<QuotationFormItem[]>([
    {
      product_service_id: "ITEM-001",
      name: "Paket konsultasi bisnis",
      quantity: 2,
      unit_price: 1500000,
      subtotal: 3000000,
      unit: "Jam",
      category: "Jasa",
    },
    {
      product_service_id: "ITEM-002",
      name: "Jasa desain logo",
      quantity: 1,
      unit_price: 750000,
      subtotal: 750000,
      unit: "Paket",
      category: "Jasa",
    },
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = getStoredCustomers();
      const parsed: Customer[] = typeof stored === "string" ? JSON.parse(stored) : stored;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCustomers([...initialCustomers, ...parsed.filter((p) => !initialCustomers.some((i) => i.id === p.id))]);
      }
    } catch {
      // ignore
    }
    setQuotationNumber(generateNextQuotationNumber());
  }, []);

  const handleAddItem = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;
    const priceNum = Math.round(parseFloat(defaultProduct.price) || 0);
    setItems((prev) => [
      ...prev,
      {
        product_service_id: defaultProduct.id,
        name: defaultProduct.name,
        quantity: 1,
        unit_price: priceNum,
        subtotal: priceNum,
        unit: defaultProduct.unit || "Unit",
        category: defaultProduct.category,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    if (!selected) return;
    const priceNum = Math.round(parseFloat(selected.price) || 0);

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          product_service_id: selected.id,
          name: selected.name,
          unit_price: priceNum,
          subtotal: priceNum * item.quantity,
          unit: selected.unit || "Unit",
          category: selected.category,
        };
      })
    );
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const safeQty = Math.max(1, quantity);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: safeQty, subtotal: item.unit_price * safeQty } : item))
    );
  };

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.subtotal, 0), [items]);
  const taxAmount = 0;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMessage("Silakan pilih pelanggan terlebih dahulu.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Penawaran wajib memiliki minimal 1 item produk atau jasa.");
      return;
    }

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);
    const newQuo: Quotation = {
      id: `QUO-${Date.now()}`,
      quotation_number: quotationNumber,
      customer_id: selectedCustomerId,
      customer_name: selectedCust?.name || "Pelanggan",
      customer_phone: selectedCust?.phone,
      customer_email: selectedCust?.email,
      customer_address: selectedCust?.address,
      quotation_date: quotationDate,
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "PENDING_APPROVAL",
      subtotal,
      discount_amount: 0,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes,
      items: items.map((it, idx) => ({
        id: `QI-${Date.now()}-${idx}`,
        product_service_id: it.product_service_id,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.subtotal,
        unit: it.unit,
        category: it.category,
      })),
      isNew: true,
      createdAt: new Date().toISOString(),
    };

    saveNewQuotationToStorage(newQuo);
    router.push("/penawaran");
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb
        items={[
          { label: "Penawaran & tagihan penjualan" },
          { label: "Penawaran", href: "/penawaran" },
          { label: "Tambah" },
        ]}
      />

      <BackLink href="/penawaran" label="Kembali ke daftar penawaran" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah penawaran</h1>
          <p className="text-xs text-slate-500 mt-1">
            Buat dan sesuaikan rincian estimasi penawaran harga untuk pelanggan.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#19376d]">
          <span className="w-2 h-2 rounded-full bg-[#19376d]" />
          <span>Status draf baru</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
              <QuotationCustomerFields
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                quotationNumber={quotationNumber}
                quotationDate={quotationDate}
                onCustomerChange={(id) => {
                  setSelectedCustomerId(id);
                  setErrorMessage(null);
                }}
                onDateChange={setQuotationDate}
              />

              <QuotationItemTable
                items={items}
                availableProducts={products}
                notes={notes}
                totalAmount={totalAmount}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onProductChange={handleProductChange}
                onQuantityChange={handleQuantityChange}
                onNotesChange={setNotes}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/penawaran"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
              >
                Batal
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#19376d] hover:bg-[#142c57] transition-colors shadow-sm cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <QuotationSummarySidebar
              itemsCount={items.length}
              subtotal={subtotal}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
              statusLabel="Draf"
              activeStep={1}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
