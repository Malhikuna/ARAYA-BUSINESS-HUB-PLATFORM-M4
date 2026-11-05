"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { findProductById, saveUpdatedProductToStorage } from "@/lib/data/mock-products";
import { ProductCategory, ProductItem } from "@/types/product";
import { ProductFormView, ProductFormValues } from "@/components/produk/ProductFormView";

const MAX_PRICE_DIGITS = 15;
const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function UbahProdukContent() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const routeParams = useParams<{ id: string }>();
  const productId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat data item katalog...</p>
      </div>
    );
  }

  const product = findProductById(productId);

  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">Item Katalog Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Data item dengan ID tersebut tidak ditemukan di katalog.
          </p>
        </div>
        <Link
          href="/produk"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  const initialIntegerPrice = product.price.split(".")[0].replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);

  const handleConfirmSave = (form: ProductFormValues) => {
    const validCategory = form.category as ProductCategory;
    const isProduct = validCategory === "Produk";
    const updatedItem: ProductItem = {
      ...product,
      name: form.name.trim(),
      category: validCategory,
      status: form.status,
      price: `${form.price.trim()}.00`,
      stock: isProduct ? (parseInt(form.stock || "0", 10) || 0) : undefined,
      unit: form.unit?.trim() || (isProduct ? "Unit" : "Paket"),
      description:
        form.description.trim() ||
        `Item ${validCategory.toLowerCase()} terdaftar untuk transaksi penawaran dan faktur.`,
    };
    saveUpdatedProductToStorage(updatedItem);
    router.push("/produk");
  };

  return (
    <ProductFormView
      key={product.id}
      mode="edit"
      sku={product.sku}
      initialValues={{
        name: product.name,
        category: product.category,
        status: product.status,
        price: initialIntegerPrice,
        description: product.description,
        stock: product.stock !== undefined ? String(product.stock) : "0",
        unit: product.unit || (product.category === "Produk" ? "Unit" : "Paket"),
      }}
      onCancel={() => router.push("/produk")}
      onConfirmSave={handleConfirmSave}
    />
  );
}

export default function UbahProdukPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-500 flex items-center justify-center">
          Memuat data item katalog...
        </div>
      }
    >
      <UbahProdukContent />
    </Suspense>
  );
}
