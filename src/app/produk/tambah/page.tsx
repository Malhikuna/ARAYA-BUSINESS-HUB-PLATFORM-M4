"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFreshForm } from "@/lib/use-fresh-form";
import { generateProductSku, saveNewProductToStorage, getStoredBusinessMode } from "@/lib/data/mock-products";
import { ProductCategory, ProductItem, BusinessMode } from "@/types/product";
import { ProductFormView, ProductFormValues } from "@/components/produk/ProductFormView";

function TambahProdukContent() {
  const { formKey, leaveForm } = useFreshForm();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode") as BusinessMode | null;
  const businessMode: BusinessMode = queryMode === "Produk" || queryMode === "Jasa" ? queryMode : getStoredBusinessMode();

  const handleConfirmSave = (form: ProductFormValues) => {
    const validCategory = form.category as ProductCategory;
    const cleanName = form.name.trim();
    const cleanPrice = form.price.trim();
    const isProduct = validCategory === "Produk";

    const newItem: ProductItem = {
      id: `ITEM-${Date.now()}`,
      sku: generateProductSku(cleanName, validCategory),
      name: cleanName,
      category: validCategory,
      price: `${cleanPrice}.00`,
      description:
        form.description.trim() ||
        `Item ${validCategory.toLowerCase()} terdaftar untuk transaksi penawaran dan faktur.`,
      status: form.status || "Aktif",
      stock: isProduct ? (parseInt(form.stock || "0", 10) || 0) : undefined,
      unit: form.unit?.trim() || (isProduct ? "Unit" : "Paket"),
      createdAt: new Date().toISOString(),
    };

    saveNewProductToStorage(newItem);
    leaveForm("/produk");
  };

  return (
    <ProductFormView
      key={formKey}
      mode="create"
      businessMode={businessMode}
      onCancel={() => leaveForm("/produk")}
      onConfirmSave={handleConfirmSave}
    />
  );
}

export default function TambahProdukPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500 text-center">Memuat formulir katalog...</div>}>
      <TambahProdukContent />
    </Suspense>
  );
}
