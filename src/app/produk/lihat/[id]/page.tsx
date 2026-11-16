"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, Package, Pencil } from "lucide-react";
import { formatRupiah, formatRibuan } from "@/lib/format";
import { findProductById, getStoredBusinessMode } from "@/lib/data/mock-products";
import { ProductItem, BusinessMode } from "@/types/product";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ProductCatalogSidebar } from "@/components/produk/ProductCatalogSidebar";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function LihatProdukDetailView({ product, businessMode = "Semua" }: { product: ProductItem; businessMode?: BusinessMode }) {
  const integerPrice = product.price.split(".")[0].replace(/\D/g, "");
  const isActive = product.status === "Aktif";
  const isProduct = product.category === "Produk";
  const isServiceOnly = businessMode === "Jasa";

  return (
    <>
      <Breadcrumb separator="/" items={[{ label: "Katalog", href: "/produk" }, { label: "Lihat" }]} className="mb-3" />
      <BackLink href="/produk" label="Kembali ke katalog" />

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
          Detail item katalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rincian informasi item produk fisik atau layanan jasa pada katalog penawaran dan faktur.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-300/90 space-y-5">
          <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-xs sm:text-sm">
              <Package className="w-4 h-4 text-[#19376d]" />
              <span>Rincian item katalog</span>
            </div>
            <div className="flex items-center gap-2.5">
              {!isServiceOnly && (
                <span className="text-xs text-slate-500 font-mono font-semibold">
                  {isProduct ? `SKU: ${product.sku}` : `Kode: ${product.sku}`}
                </span>
              )}
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Aktif</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Nonaktif</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-800 mb-2">Nama item katalog</span>
            <div className="w-full min-h-11 px-4 py-2.5 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 flex items-center">
              {product.name}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-2">Kategori</span>
              <div className="w-full h-11 px-4 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center">
                {product.category === "Produk" ? "Produk (Barang Fisik)" : "Jasa (Layanan)"}
              </div>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-2">Status katalog</span>
              <div className="w-full h-11 px-4 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center">
                {product.status}
              </div>
            </div>
          </div>

          {/* Stok Fisik atau Satuan Layanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isProduct ? (
              <>
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">Stok Tersedia</span>
                  <div className="w-full h-11 px-4 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm font-bold text-[#19376d] flex items-center">
                    {product.stock ?? 0} {product.unit || "Unit"}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">Satuan Barang</span>
                  <div className="w-full h-11 px-4 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center">
                    {product.unit || "Unit"}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <span className="block text-xs font-bold text-slate-800 mb-2">Satuan Layanan</span>
                <div className="w-full h-11 px-4 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center">
                  Per {product.unit || "Paket"}
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-800 mb-2">Harga Satuan Acuan (Rp)</span>
            <div className="flex items-center h-11 rounded-lg overflow-hidden bg-[#f8fafc] border border-slate-200">
              <div className="h-full px-3.5 bg-[#f0f4fa] border-r border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 select-none shrink-0">
                Rp
              </div>
              <div className="w-full px-3.5 text-xs sm:text-sm font-semibold text-slate-900">
                {formatRibuan(integerPrice)}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Harga dasar sebelum pengenaan PPN 11% dan diskon transaksi.
            </p>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-800 mb-2">Deskripsi</span>
            <div className="w-full min-h-24 p-3.5 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {product.description}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-300 flex items-center justify-end gap-3">
            <Link
              href="/produk"
              className="px-5 h-10 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center justify-center transition-colors"
            >
              Kembali
            </Link>
            <Link
              href={`/produk/ubah/${product.id}`}
              className="px-5 h-10 rounded-lg bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Ubah item katalog</span>
            </Link>
          </div>
        </div>

        <ProductCatalogSidebar
          mode="detail"
          categoryLabel={product.category}
          displayName={product.name}
          isNameFilled
          descriptionText={product.description}
          previewPrice={formatRupiah(product.price)}
          sku={isProduct ? product.sku : undefined}
        />
      </div>
    </>
  );
}

function LihatProdukContent() {
  const isMounted = useIsMounted();
  const routeParams = useParams<{ id: string }>();
  const productId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat detail item katalog...</p>
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
            Data item katalog dengan ID tersebut tidak ditemukan.
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

  const businessMode = getStoredBusinessMode();
  return <LihatProdukDetailView product={product} businessMode={businessMode} />;
}

export default function LihatProdukPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-500 flex items-center justify-center">
          Memuat detail item katalog...
        </div>
      }
    >
      <LihatProdukContent />
    </Suspense>
  );
}
