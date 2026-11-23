"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { CustomerPortalDevToggle } from "@/components/common/CustomerPortalDevToggle";
import { CustomerInvoiceList } from "@/components/invoice/CustomerInvoiceList";
import { PartnerInvoiceTable } from "@/components/invoice/PartnerInvoiceTable";
import { MidtransSnapModal } from "@/components/invoice/MidtransSnapModal";
import { InvoiceFilterStatus, InvoiceRecord } from "@/types/invoice-order";
import { useCustomerPortalMode } from "@/lib/auth/customer-portal";
import { normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";
import {
  completeSandboxInvoicePayment,
  fetchInvoicesForViewerApi,
  initiateMidtransPaymentApi,
} from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

export default function InvoicePage() {
  const { isCustomer, customerUserId, isDevPreviewAvailable, toggleCustomerPreview } =
    useCustomerPortalMode();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilterStatus>("ALL");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [snapModalInvoice, setSnapModalInvoice] = useState<InvoiceRecord | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [toast, setToast] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({ status: "hidden", title: "", description: "" });

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchInvoicesForViewerApi(isCustomer, customerUserId).then((list) => {
        if (active) setInvoices(list);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, [isCustomer, customerUserId]);

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

  const handlePayInvoice = async (invoice: InvoiceRecord) => {
    if (payingInvoiceId) return;
    setPayingInvoiceId(invoice.id);
    try {
      const result = await initiateMidtransPaymentApi(invoice);
      if (result.mode === "error") {
        setToast({
          status: "visible",
          title: "Tidak dapat memulai pembayaran",
          description: result.message,
        });
        return;
      }

      if (result.mode === "snap") {
        if (typeof window !== "undefined" && window.snap?.pay) {
          window.snap.pay(result.snapToken, {
            onSuccess: () => {
              completeSandboxInvoicePayment(invoice.id, "Midtrans Snap");
              setToast({
                status: "visible",
                title: "Pembayaran berhasil",
                description: `Status ${invoice.invoice_number} otomatis diperbarui menjadi Lunas.`,
              });
            },
            onError: () => {
              setToast({
                status: "visible",
                title: "Pembayaran gagal. Silakan coba lagi.",
                description: `Status ${invoice.invoice_number} tetap Belum lunas (BR-08).`,
              });
            },
          });
          return;
        }
        if (result.redirectUrl) {
          window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }

      setSnapModalInvoice(invoice);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleConfirmSandboxPaid = (paymentMethod: string) => {
    if (!snapModalInvoice) return;
    setIsConfirmingPayment(true);
    try {
      const paid = completeSandboxInvoicePayment(snapModalInvoice.id, paymentMethod);
      setSnapModalInvoice(null);
      if (paid) {
        setToast({
          status: "visible",
          title: "Pembayaran berhasil",
          description: `Invoice ${paid.invoice_number} otomatis berstatus Lunas via ${paymentMethod}.`,
        });
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleSimulateSandboxFailed = () => {
    if (!snapModalInvoice) return;
    const invNum = snapModalInvoice.invoice_number;
    setSnapModalInvoice(null);
    setToast({
      status: "visible",
      title: "Pembayaran gagal. Silakan coba lagi.",
      description: `Transaksi ${invNum} dibatalkan atau ditolak. Status invoice tetap Belum lunas (BR-08).`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <ToastNotification
        status={toast.status}
        title={toast.title}
        description={toast.description}
        onDismiss={() => setToast((prev) => ({ ...prev, status: "hidden" }))}
      />

      <Breadcrumb items={[{ label: isCustomer ? "Invoice saya" : "Invoice" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-slate-900">
            {isCustomer ? "Invoice saya" : "Daftar invoice"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCustomer
              ? "Daftar tagihan resmi atas pesanan Anda beserta pembayaran langsung melalui Midtrans Snap."
              : "Pantau status tagihan invoice dan pelunasan otomatis dari Midtrans."}
          </p>
        </div>

        {isDevPreviewAvailable && (
          <CustomerPortalDevToggle isCustomer={isCustomer} onToggle={toggleCustomerPreview} />
        )}
      </div>

      {isCustomer ? (
        <CustomerInvoiceList
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          payingInvoiceId={payingInvoiceId}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPayInvoice={(inv) => void handlePayInvoice(inv)}
        />
      ) : (
        <PartnerInvoiceTable
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      <MidtransSnapModal
        open={Boolean(snapModalInvoice)}
        invoice={snapModalInvoice}
        isProcessing={isConfirmingPayment}
        onConfirmPaid={handleConfirmSandboxPaid}
        onSimulateFailed={handleSimulateSandboxFailed}
        onClose={() => !isConfirmingPayment && setSnapModalInvoice(null)}
      />
    </div>
  );
}
