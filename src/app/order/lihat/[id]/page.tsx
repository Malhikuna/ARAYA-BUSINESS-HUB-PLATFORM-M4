"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  Play,
  ShieldAlert,
} from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { CustomerPortalDevToggle } from "@/components/common/CustomerPortalDevToggle";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { OrderProgressStepper, OrderStatusBadge } from "@/components/order/OrderProgressStepper";
import { OrderRecord, OrderStatus } from "@/types/invoice-order";
import { formatRupiah } from "@/lib/format";
import { useCustomerPortalMode } from "@/lib/auth/customer-portal";
import { useDevRole } from "@/lib/auth/dev-role";
import {
  canCustomerViewRecord,
  evaluateOrderProcessGuard,
  formatDateTimeWib,
  getOrderStatusLabel,
  normalizeInvoiceStatus,
} from "@/lib/invoice-order-helpers";
import {
  fetchOrdersForViewerApi,
  updatePartnerOrderStatusApi,
} from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

function DetailOrderContent() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ? decodeURIComponent(params.id) : "";
  const { isCustomer, customerUserId, isDevPreviewAvailable, toggleCustomerPreview } =
    useCustomerPortalMode();
  const { profile } = useDevRole();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confirmNextStatus, setConfirmNextStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({ status: "hidden", title: "", description: "" });

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchOrdersForViewerApi(isCustomer, customerUserId).then((list) => {
        if (!active) return;
        const found =
          list.find(
            (item) =>
              item.id.toLowerCase() === orderId.toLowerCase() ||
              item.order_number.toLowerCase() === orderId.toLowerCase()
          ) || null;
        const allowed =
          found && (!isCustomer || canCustomerViewRecord(found.customer_user_id, customerUserId))
            ? found
            : null;
        setOrder(allowed);
        setIsLoaded(true);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, [orderId, isCustomer, customerUserId]);

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">Pesanan tidak ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pesanan tidak tersedia atau bukan milik akun Anda (UC-09 | BR-10).
          </p>
        </div>
        <Link
          href="/order"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          {isCustomer ? "Kembali ke Pesanan saya" : "Kembali ke daftar order"}
        </Link>
      </div>
    );
  }

  const guard = evaluateOrderProcessGuard(order);
  const isInvoicePaid = normalizeInvoiceStatus(order.invoice_status) === "PAID";

  const handleConfirmUpdate = async () => {
    if (!confirmNextStatus || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await updatePartnerOrderStatusApi(
        order,
        confirmNextStatus,
        `${profile.name} (${profile.roleLabel})`
      );
      setConfirmNextStatus(null);
      if (!res.ok) {
        setToast({
          status: "visible",
          title: "Perubahan status ditolak",
          description: res.message,
        });
        return;
      }
      setOrder(res.order);
      setToast({
        status: "visible",
        title: "Status order diperbarui",
        description: `Order ${order.order_number} kini berstatus ${getOrderStatusLabel(confirmNextStatus)}.`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <ToastNotification
        status={toast.status}
        title={toast.title}
        description={toast.description}
        onDismiss={() => setToast((prev) => ({ ...prev, status: "hidden" }))}
      />

      <Breadcrumb
        items={[
          { label: isCustomer ? "Pesanan saya" : "Order", href: "/order" },
          { label: order.order_number },
        ]}
        separator="/"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink
          href="/order"
          label={isCustomer ? "Kembali ke Pesanan saya" : "Kembali ke daftar order"}
        />
        {isDevPreviewAvailable && (
          <CustomerPortalDevToggle isCustomer={isCustomer} onToggle={toggleCustomerPreview} />
        )}
      </div>

      {/* Header Order & Aksi Partner (Guard U-01 & BR-09) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              {order.order_number}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500">
            {order.title} | {isCustomer ? order.partner_name : order.customer_name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isCustomer ? (
            !isInvoicePaid ? (
              <Link
                href={`/invoice/lihat/${encodeURIComponent(order.invoice_id)}`}
                className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar invoice {order.invoice_number}</span>
              </Link>
            ) : null
          ) : guard.isFinal ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={guard.reason || undefined}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Order selesai (Final)</span>
            </button>
          ) : guard.blockedByUnpaidInvoice ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={guard.reason || undefined}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed opacity-80"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Proses order (Menunggu lunas)</span>
            </button>
          ) : guard.canProcess ? (
            <button
              type="button"
              onClick={() => setConfirmNextStatus("diproses")}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Proses order</span>
            </button>
          ) : guard.canComplete ? (
            <button
              type="button"
              onClick={() => setConfirmNextStatus("selesai")}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-[#0e7490] hover:bg-[#0c6077] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan order</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Peringatan Guard U-01 / Final BR-09 di UI Partner */}
      {!isCustomer && guard.blockedByUnpaidInvoice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Tombol Proses order dinonaktifkan (Aturan U-01)</p>
            <p className="text-amber-900 leading-relaxed">{guard.reason}</p>
          </div>
        </div>
      )}

      {!isCustomer && guard.isFinal && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>{guard.reason}</p>
        </div>
      )}

      {/* Komponen Progres Order (PRO-67) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Progres pengerjaan pesanan</h2>
          <span className="text-xs text-slate-500">Status: {getOrderStatusLabel(order.status)}</span>
        </div>
        <OrderProgressStepper
          currentStatus={order.status}
          statusUpdatedAt={order.status_updated_at}
          timeline={order.timeline}
        />
      </div>

      {/* Grid 2 Kolom: Rincian Item & Riwayat + Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Rincian pesanan</h2>
            <span className="font-heading font-bold text-sm text-[#19376d]">
              {formatRupiah(order.total_amount)}
            </span>
          </div>
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-120 text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f4f7fb] text-slate-700 font-semibold border-b border-slate-200/70">
                  <th className="px-5 py-3">Item</th>
                  <th className="px-4 py-3 text-center">Jumlah</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          {/* Card Invoice Terkait */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Invoice terkait</span>
              <InvoiceStatusBadge status={order.invoice_status} compact />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nomor invoice</span>
              <Link
                href={`/invoice/lihat/${encodeURIComponent(order.invoice_id)}`}
                className="inline-flex items-center gap-1 font-mono font-bold text-[#0e7490] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{order.invoice_number}</span>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Partner penyedia</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-[#19376d]" />
                <span>{order.partner_name}</span>
              </span>
            </div>
          </div>

          {/* Card Riwayat Perubahan Status */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Riwayat status
            </h2>
            <div className="space-y-3.5">
              {[...order.timeline].reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#19376d] mt-1 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-bold text-slate-900">{entry.title}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{entry.description}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {formatDateTimeWib(entry.timestamp)} | {entry.actor_label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={Boolean(confirmNextStatus)}
        title={
          confirmNextStatus === "diproses" ? "Proses order sekarang?" : "Tandai order Selesai?"
        }
        subtitle="Konfirmasi pembaruan status order (UC-08)"
        description={
          confirmNextStatus === "diproses"
            ? "Status order akan diperbarui menjadi Diproses dan waktu perubahan dicatat."
            : "Order berstatus Selesai bersifat final dan tidak dapat diubah lagi (BR-09)."
        }
        confirmLabel={isUpdating ? "Menyimpan..." : "Ya, perbarui status"}
        variant="primary"
        onConfirm={() => void handleConfirmUpdate()}
        onCancel={() => !isUpdating && setConfirmNextStatus(null)}
      />
    </div>
  );
}

export default function DetailOrderPage() {
  return (
    <Suspense fallback={<div className="p-10 text-xs text-slate-500 text-center">Memuat pesanan...</div>}>
      <DetailOrderContent />
    </Suspense>
  );
}
