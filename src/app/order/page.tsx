"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ToastNotification, ToastStatus } from "@/components/common/ToastNotification";
import { PartnerOrderTable } from "@/components/order/PartnerOrderTable";
import { OrderFilterStatus, OrderRecord, OrderStatus } from "@/types/invoice-order";
import { useDevRole } from "@/lib/auth/dev-role";
import { getOrderStatusLabel, normalizeOrderStatus } from "@/lib/invoice-order-helpers";
import {
  fetchPartnerOrdersApi,
  updatePartnerOrderStatusApi,
} from "@/lib/data/invoice-order-api";
import { subscribeInvoiceOrderStore } from "@/lib/data/mock-invoices-orders";

export default function OrderPage() {
  const { profile } = useDevRole();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>("ALL");
  const [pendingAction, setPendingAction] = useState<{
    order: OrderRecord;
    nextStatus: OrderStatus;
  } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    status: ToastStatus;
    title: string;
    description: string;
  }>({ status: "hidden", title: "", description: "" });

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchPartnerOrdersApi().then((list) => {
        if (active) setOrders(list);
      });
    };
    load();
    const unsub = subscribeInvoiceOrderStore(load);
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((ord) => {
      const canonical = normalizeOrderStatus(ord.status);
      const matchStatus = statusFilter === "ALL" || canonical === statusFilter;
      const matchQuery =
        !q ||
        `${ord.order_number} ${ord.invoice_number} ${ord.title} ${ord.customer_name} ${ord.partner_name}`
          .toLowerCase()
          .includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleConfirmStatusChange = async () => {
    if (!pendingAction || updatingOrderId) return;
    const { order, nextStatus } = pendingAction;
    setUpdatingOrderId(order.id);
    try {
      const result = await updatePartnerOrderStatusApi(
        order,
        nextStatus,
        `${profile.name} (${profile.roleLabel})`
      );
      setPendingAction(null);
      if (!result.ok) {
        setToast({
          status: "visible",
          title: "Perubahan status ditolak",
          description: result.message,
        });
        return;
      }

      setToast({
        status: "visible",
        title: "Status order diperbarui",
        description: `Order ${order.order_number} kini berstatus ${getOrderStatusLabel(nextStatus)}.`,
      });
    } finally {
      setUpdatingOrderId(null);
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

      <Breadcrumb items={[{ label: "Order" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-slate-900">
          Daftar order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola progres pengerjaan pesanan (Baru | Diproses | Selesai) dengan validasi pembayaran lunas (Aturan U-01).
        </p>
      </div>

      <PartnerOrderTable
        orders={orders}
        filteredOrders={filteredOrders}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        updatingOrderId={updatingOrderId}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onRequestStatusChange={(order, nextStatus) => setPendingAction({ order, nextStatus })}
      />

      <ConfirmationModal
        open={Boolean(pendingAction)}
        title={
          pendingAction?.nextStatus === "diproses"
            ? "Proses order sekarang?"
            : "Tandai order sebagai Selesai?"
        }
        subtitle="Konfirmasi pembaruan progres order (UC-08)"
        description={
          pendingAction?.nextStatus === "diproses"
            ? "Status order akan berubah dari Baru menjadi Diproses dan waktu perubahan tercatat secara otomatis."
            : "Status Selesai bersifat final (BR-09). Setelah diselesaikan, status order tidak dapat diubah kembali."
        }
        confirmLabel={
          updatingOrderId
            ? "Menyimpan..."
            : pendingAction?.nextStatus === "diproses"
            ? "Ya, proses order"
            : "Ya, selesaikan order"
        }
        variant="primary"
        onConfirm={() => void handleConfirmStatusChange()}
        onCancel={() => !updatingOrderId && setPendingAction(null)}
      >
        {pendingAction && (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Nomor order</span>
              <span className="font-mono font-bold text-slate-900">
                {pendingAction.order.order_number}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-semibold text-slate-800">
                {pendingAction.order.customer_name}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Status tujuan</span>
              <span className="font-bold text-[#19376d]">
                {getOrderStatusLabel(pendingAction.nextStatus)}
              </span>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}
