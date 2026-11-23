"use client";

import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice-order";
import { getInvoiceStatusLabel, normalizeInvoiceStatus } from "@/lib/invoice-order-helpers";

export interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  compact?: boolean;
}

export function InvoiceStatusBadge({ status, compact = false }: InvoiceStatusBadgeProps) {
  const isPaid = normalizeInvoiceStatus(status) === "PAID";
  const label = getInvoiceStatusLabel(status);
  const padding = compact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  if (isPaid) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap ${padding}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-100 text-amber-800 whitespace-nowrap ${padding}`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
