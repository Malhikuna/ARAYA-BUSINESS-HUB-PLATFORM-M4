"use client";

import React from "react";
import { UserCheck, Wrench } from "lucide-react";

export interface CustomerPortalDevToggleProps {
  isCustomer: boolean;
  onToggle: (nextCustomerMode: boolean) => void;
}

/**
 * Pengalih pratinjau lokal (khusus dev-mode) untuk menguji tampilan Partner vs Customer M1.
 */
export function CustomerPortalDevToggle({
  isCustomer,
  onToggle,
}: CustomerPortalDevToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#eef4ff] border border-blue-100 text-xs shrink-0">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          !isCustomer ? "bg-white text-[#19376d] shadow-2xs" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>Partner</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          isCustomer ? "bg-[#19376d] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>Customer M1</span>
      </button>
    </div>
  );
}
