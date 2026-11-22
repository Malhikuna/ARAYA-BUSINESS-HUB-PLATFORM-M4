"use client";

import React, { useEffect, useState, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { getStoredPermintaan, savePermintaanToStorage } from "@/lib/data/mock-permintaan";
import {
  fetchServiceRequestByIdFromApi,
  mergeServiceRequestsWithLocal,
  isUuid,
} from "@/lib/data/service-requests-api";
import { PermintaanItem } from "@/types/permintaan";
import { PermintaanDetailHero } from "@/components/permintaan/PermintaanDetailHero";
import { PermintaanDetailContent } from "@/components/permintaan/PermintaanDetailContent";
import { PermintaanDetailSidebar } from "@/components/permintaan/PermintaanDetailSidebar";
import { useDevRole } from "@/lib/auth/dev-role";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function DetailPermintaanContent() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { isDev, activeRole } = useDevRole();
  const isUnauthorizedRole = isDev && activeRole !== "PARTNER_SERVICE";
  const routeParams = useParams<{ id: string }>();
  const itemId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  const localItem = isMounted && !isUnauthorizedRole
    ? getStoredPermintaan().find((p) => p.id.toLowerCase() === itemId.toLowerCase()) || null
    : null;

  const [apiItem, setApiItem] = useState<PermintaanItem | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(() => isUuid(itemId));

  useEffect(() => {
    if (isMounted && isUnauthorizedRole) {
      router.replace("/produk");
    }
  }, [isMounted, isUnauthorizedRole, router]);

  useEffect(() => {
    if (!isMounted || isUnauthorizedRole || !isUuid(itemId)) return;
    let active = true;
    fetchServiceRequestByIdFromApi(itemId)
      .then((found) => {
        if (!active) return;
        setApiItem(found);
        if (found) {
          savePermintaanToStorage(mergeServiceRequestsWithLocal([found], getStoredPermintaan()));
        }
      })
      .finally(() => {
        if (active) setIsLoadingApi(false);
      });
    return () => {
      active = false;
    };
  }, [isMounted, isUnauthorizedRole, itemId]);

  const item = apiItem || localItem;

  if (!isMounted || (isLoadingApi && !item)) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat rincian permintaan jasa...</p>
      </div>
    );
  }

  if (isUnauthorizedRole) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">Akses Khusus Partner Jasa</h2>
          <p className="text-xs text-slate-500 mt-1">
            Detail Permintaan Jasa hanya dapat diakses oleh Partner Jasa sesuai aturan BR-13.
          </p>
        </div>
        <Link
          href="/produk"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          Kembali ke Katalog
        </Link>
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

  const displayCode = item.displayCode || item.id;

  return (
    <>
      <Breadcrumb
        separator="/"
        items={[
          { label: "Permintaan", href: "/permintaan" },
          { label: displayCode },
        ]}
        className="mb-3"
      />
      <BackLink href="/permintaan" label="Kembali ke daftar permintaan" />

      <PermintaanDetailHero item={item} />

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
