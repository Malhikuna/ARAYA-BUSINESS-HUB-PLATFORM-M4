"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { findPermintaanById } from "@/lib/data/mock-permintaan";
import { PermintaanDetailHero } from "@/components/permintaan/PermintaanDetailHero";
import { PermintaanDetailContent } from "@/components/permintaan/PermintaanDetailContent";
import { PermintaanDetailSidebar } from "@/components/permintaan/PermintaanDetailSidebar";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function DetailPermintaanContent() {
  const isMounted = useIsMounted();
  const routeParams = useParams<{ id: string }>();
  const itemId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";
  const item = isMounted ? findPermintaanById(itemId) : null;

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat rincian permintaan jasa...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">
            Permintaan Jasa Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data permintaan dengan nomor &ldquo;{itemId}&rdquo; tidak ditemukan.
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

  return (
    <>
      <Breadcrumb
        separator="/"
        items={[
          { label: "Permintaan", href: "/permintaan" },
          { label: item.id },
        ]}
        className="mb-3"
      />
      <BackLink href="/permintaan" label="Kembali ke daftar permintaan" />

      {/* Hero Header */}
      <PermintaanDetailHero item={item} />

      {/* Main Grid: Content (8 cols) & Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <PermintaanDetailContent item={item} />
        </div>
        <div className="lg:col-span-4">
          <PermintaanDetailSidebar item={item} />
        </div>
      </div>
    </>
  );
}

export default function DetailPermintaanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-xs text-slate-500 text-center">
          Memuat rincian permintaan...
        </div>
      }
    >
      <DetailPermintaanContent />
    </Suspense>
  );
}
