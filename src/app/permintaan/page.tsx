"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import {
  getStoredPermintaan,
  subscribePermintaanStorage,
} from "@/lib/data/mock-permintaan";
import { PermintaanItem } from "@/types/permintaan";
import { PermintaanMetricCards } from "@/components/permintaan/PermintaanMetricCards";
import {
  PermintaanFilterBar,
  PermintaanTabFilter,
} from "@/components/permintaan/PermintaanFilterBar";
import { PermintaanTable } from "@/components/permintaan/PermintaanTable";
import { matchesPermintaanQuery } from "@/lib/search-matchers";

const ITEMS_PER_PAGE = 10;

export default function PermintaanPage() {
  const [items, setItems] = useState<PermintaanItem[]>([]);
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
    const timer = window.setTimeout(() => {
      setItems(getStoredPermintaan());
    }, 0);
    const unsubscribe = subscribePermintaanStorage(() => {
      setItems(getStoredPermintaan());
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

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
    // Prioritaskan status "Baru" selalu di paling atas, kemudian urutkan tanggal terbaru
    return [...list].sort((a, b) => {
      if (a.status === "Baru" && b.status !== "Baru") return -1;
      if (a.status !== "Baru" && b.status === "Baru") return 1;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [items, activeTab, searchTerm]);

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

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#19376d] border border-blue-100/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0e7490] animate-pulse" />
            <span>Sinkron otomatis</span>
          </span>
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

      {/* Data Table */}
      <PermintaanTable
        items={currentData}
        totalFiltered={filteredItems.length}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </>
  );
}
