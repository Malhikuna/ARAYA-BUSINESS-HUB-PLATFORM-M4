"use client";

import React from "react";
import { Check, Clock, PackageCheck, RefreshCw, Inbox } from "lucide-react";
import { OrderStatus, OrderTimelineEntry } from "@/types/invoice-order";
import {
  formatDateTimeWib,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from "@/lib/invoice-order-helpers";

const ORDER_STEPS: { key: OrderStatus; label: string; caption: string }[] = [
  { key: "baru", label: "Baru", caption: "Order diterima" },
  { key: "diproses", label: "Diproses", caption: "Sedang dikerjakan" },
  { key: "selesai", label: "Selesai", caption: "Transaksi tuntas" },
];

export function OrderStatusBadge({
  status,
  compact = false,
}: {
  status: OrderStatus;
  compact?: boolean;
}) {
  const canonical = normalizeOrderStatus(status);
  const label = getOrderStatusLabel(canonical);
  const padding = compact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  if (canonical === "selesai") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap ${padding}`}
      >
        <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (canonical === "diproses") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-[#19376d] whitespace-nowrap ${padding}`}
      >
        <RefreshCw className="w-3.5 h-3.5 text-[#0e7490] shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-100 text-slate-700 whitespace-nowrap ${padding}`}
    >
      <Inbox className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export interface OrderProgressStepperProps {
  currentStatus: OrderStatus;
  statusUpdatedAt: string;
  timeline?: OrderTimelineEntry[];
  compact?: boolean;
}

/**
 * Komponen progres status Order terpadu (PRO-67): Baru -> Diproses -> Selesai
 * dilengkapi timestamp pembaruan terakhir.
 */
export function OrderProgressStepper({
  currentStatus,
  statusUpdatedAt,
  timeline = [],
  compact = false,
}: OrderProgressStepperProps) {
  const canonical = normalizeOrderStatus(currentStatus);
  const activeIdx = ORDER_STEPS.findIndex((s) => s.key === canonical);

  const findStepTimestamp = (stepStatus: OrderStatus): string | null => {
    const match = [...timeline].reverse().find((t) => normalizeOrderStatus(t.status) === stepStatus);
    return match ? formatDateTimeWib(match.timestamp) : null;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {ORDER_STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx || (idx === activeIdx && canonical === "selesai");
          const isCurrent = idx === activeIdx && canonical !== "selesai";
          const stepTime = findStepTimestamp(step.key);

          return (
            <div
              key={step.key}
              className={`rounded-xl border p-2.5 sm:p-3 transition-colors ${
                isCompleted
                  ? "bg-emerald-50/60 border-emerald-200/80"
                  : isCurrent
                  ? "bg-[#eef4ff] border-blue-200"
                  : "bg-slate-50/70 border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#19376d] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    isCompleted
                      ? "text-emerald-800"
                      : isCurrent
                      ? "text-[#19376d]"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!compact && (
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {stepTime || step.caption}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Pembaruan terakhir: {formatDateTimeWib(statusUpdatedAt)}</span>
      </div>
    </div>
  );
}
