"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { generateProductSku, saveNewProductToStorage } from "@/lib/data/mock-products";
import { ProductCategory, ProductItem } from "@/types/product";
import { ProductFormView, ProductFormValues } from "@/components/produk/ProductFormView";

export default function TambahProdukPage() {
  const router = useRouter();

  const handleConfirmSave = (form: ProductFormValues) => {
    const validCategory = form.category as ProductCategory;
    const cleanName = form.name.trim();
    const cleanPrice = form.price.trim();

    const newItem: ProductItem = {
      id: `ITEM-${Date.now()}`,
      sku: generateProductSku(cleanName, validCategory),
      name: cleanName,
      category: validCategory,
      price: `${cleanPrice}.00`,
      description:
        form.description.trim() ||
        `Item ${validCategory.toLowerCase()} terdaftar untuk transaksi penawaran dan faktur.`,
      status: "Aktif",
      createdAt: new Date().toISOString(),
    };

    saveNewProductToStorage(newItem);
    router.push("/produk");
  };

  return (
    <ProductFormView
      mode="create"
      onCancel={() => router.push("/produk")}
      onConfirmSave={handleConfirmSave}
    />
  );
}
