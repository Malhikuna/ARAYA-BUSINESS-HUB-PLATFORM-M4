"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Send, RefreshCw, AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import {
  getStoredPermintaan,
  savePermintaanToStorage,
  subscribePermintaanStorage,
} from "@/lib/data/mock-permintaan";
import {
  applyLocalQuotationOverlayToRequests,
  fetchServiceRequestsFromApi,
  getLocalActiveAddedQuotations,
  mergeServiceRequestsWithLocal,
} from "@/lib/data/service-requests-api";
import { PermintaanItem } from "@/types/permintaan";
import { PermintaanMetricCards } from "@/components/permintaan/PermintaanMetricCards";
import {
  PermintaanFilterBar,
  PermintaanTabFilter,
} from "@/components/permintaan/PermintaanFilterBar";
import { PermintaanTable } from "@/components/permintaan/PermintaanTable";
import { M5ServiceRequestSimulatorModal } from "@/components/permintaan/M5ServiceRequestSimulatorModal";
import { matchesPermintaanQuery } from "@/lib/search-matchers";
import { useDevRole } from "@/lib/auth/dev-role";

const ITEMS_PER_PAGE = 10;

export default function PermintaanPage() {
  const router = useRouter();
  const { isDev, activeRole } = useDevRole();
  const showSimulator = isDev || process.env.NODE_ENV !== "production";
  const isUnauthorizedRole = activeRole !== "PARTNER_SERVICE";

  const [items, setItems] = useState<PermintaanItem[]>([]);
  const dbItemsRef = useRef<PermintaanItem[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PermintaanTabFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [toastState, setToastState] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({
    status: "hidden",
    title: "",
    description: "",
  });

  useEffect(() => {
    if (isUnauthorizedRole) {
      router.replace("/produk");
    }
  }, [isUnauthorizedRole, router]);

  const loadFromApi = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await fetchServiceRequestsFromApi();
      if (result.ok) {
        setApiError(null);
        dbItemsRef.current = result.items;
        const resolved = applyLocalQuotationOverlayToRequests(
          result.items,
          getLocalActiveAddedQuotations()
        );
        setItems(resolved);
        savePermintaanToStorage(resolved);
      } else {
        setApiError(result.message);
      }
    } finally {
      setIsSyncing(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isUnauthorizedRole) return;
    const timer = window.setTimeout(() => {
      const stored = getStoredPermintaan();
      const hasCachedDbItems =
        stored.length > 0 && stored.every((entry) => !entry.id.startsWith("PMT-"));
      if (hasCachedDbItems) {
        setItems(stored);
      }
      void loadFromApi();
    }, 0);
    const unsubscribe = subscribePermintaanStorage(() => {
      if (dbItemsRef.current !== null) {
        setItems(
          applyLocalQuotationOverlayToRequests(
            dbItemsRef.current,
            getLocalActiveAddedQuotations()
          )
        );
      }
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [isUnauthorizedRole, loadFromApi]);

  const handleSimulatedCreated = (createdItem: PermintaanItem) => {
    const nextDbItems =
      dbItemsRef.current && dbItemsRef.current.length > 0
        ? mergeServiceRequestsWithLocal([createdItem], dbItemsRef.current)
        : [createdItem];
    dbItemsRef.current = nextDbItems;
    const resolved = applyLocalQuotationOverlayToRequests(
      nextDbItems,
      getLocalActiveAddedQuotations()
    );
    setItems(resolved);
    savePermintaanToStorage(resolved);
    setCurrentPage(1);
    setToastState({
      status: "visible",
      title: `Permintaan ${createdItem.displayCode || createdItem.id} diterima`,
      description: `Permintaan dari ${createdItem.customerName} berhasil disimpan melalui POST /api/m4/v1/service-requests.`,
    });
  };

  const newCount = useMemo(
    () => items.filter((i) => i.status === "Baru").length,
    [items]
  );
  const offeredCount = useMemo(
    () => items.filter((i) => i.status === "Sudah ditawarkan").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    let list = items;
    if (activeTab !== "ALL") {
      list = list.filter((i) => i.status === activeTab);
    }
    if (searchTerm.trim()) {
      list = list.filter((i) => matchesPermintaanQuery(i, searchTerm));
    }
    // Prioritaskan status "Baru" di atas, kemudian urutkan waktu masuk terbaru dengan guard NaN
    return [...list].sort((a, b) => {
      if (a.status === "Baru" && b.status !== "Baru") return -1;
      if (a.status !== "Baru" && b.status === "Baru") return 1;
      const rawA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const rawB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = Number.isFinite(rawA) ? rawA : 0;
      const timeB = Number.isFinite(rawB) ? rawB : 0;
      return timeB - timeA;
    });
  }, [items, activeTab, searchTerm]);

  if (isUnauthorizedRole) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">Akses Khusus Partner Jasa</h2>
          <p className="text-xs text-slate-500 mt-1">
            Halaman Permintaan Jasa hanya dapat diakses oleh Partner Jasa sesuai aturan BR-13.
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

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleTabChange = (tab: PermintaanTabFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return (
    <>
      <ToastNotification
        status={toastState.status}
        title={toastState.title}
        description={toastState.description}
        onDismiss={() => setToastState((prev) => ({ ...prev, status: "hidden" }))}
      />

      <Breadcrumb separator="/" items={[{ label: "Permintaan" }]} className="mb-3" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Daftar permintaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Permintaan jasa yang dikirim customer dari katalog
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadFromApi()}
            disabled={isSyncing}
            title="Muat ulang permintaan dari API M4"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0e7490] ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Sinkron API"}</span>
          </button>

          {showSimulator && (
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#19376d] hover:bg-[#122852] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulasi Form M5</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <PermintaanMetricCards
        newCount={newCount}
        offeredCount={offeredCount}
        totalCount={items.length}
      />

      {/* Filter Bar with Tabs & Search */}
      <PermintaanFilterBar
        activeTab={activeTab}
        newCount={newCount}
        offeredCount={offeredCount}
        searchTerm={searchTerm}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
      />

      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Gagal memuat permintaan jasa:</span> {apiError}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadFromApi()}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-rose-700 border border-rose-200 hover:bg-rose-100/70 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Coba lagi</span>
          </button>
        </div>
      )}

      {/* Data Table */}
      <PermintaanTable
        items={currentData}
        totalFiltered={filteredItems.length}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        emptyMessage={
          items.length === 0 && !searchTerm.trim() && activeTab === "ALL"
            ? apiError
              ? "Data permintaan jasa belum dapat dimuat dari server. Silakan klik Coba lagi."
              : !hasLoaded && isSyncing
              ? "Memuat daftar permintaan jasa..."
              : "Belum ada permintaan jasa masuk dari customer."
            : "Tidak ada permintaan jasa yang sesuai filter atau pencarian."
        }
        onPageChange={(page) => setCurrentPage(page)}
      />

      {showSimulator && (
        <M5ServiceRequestSimulatorModal
          open={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onCreated={handleSimulatedCreated}
        />
      )}
    </>
  );
}
