"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PartnerInvoiceTable } from "@/components/invoice/PartnerInvoiceTable";
import { InvoiceFilterStatus, InvoiceRecord } from "@/types/invoice-order";
import { normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";
import { fetchPartnerInvoicesApi } from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilterStatus>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInvoices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await fetchPartnerInvoicesApi();
      setInvoices(list);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchPartnerInvoicesApi().then((list) => {
        if (active) setInvoices(list);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return invoices.filter((inv) => {
      const canonical = normalizeInvoiceStatus(inv.status);
      const matchStatus = statusFilter === "ALL" || canonical === statusFilter;
      const matchQuery =
        !q ||
        `${inv.invoice_number} ${inv.title} ${inv.partner_name} ${inv.customer_name} ${inv.order_number || ""}`
          .toLowerCase()
          .includes(q);
      return matchStatus && matchQuery;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb items={[{ label: "Invoice" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-slate-900">
            Daftar invoice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau status tagihan invoice dan pelunasan otomatis dari webhook Midtrans (BR-08).
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void loadInvoices()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0e7490] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Menyinkronkan..." : "Perbarui status"}</span>
        </button>
      </div>

      <PartnerInvoiceTable
        invoices={invoices}
        filteredInvoices={filteredInvoices}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
