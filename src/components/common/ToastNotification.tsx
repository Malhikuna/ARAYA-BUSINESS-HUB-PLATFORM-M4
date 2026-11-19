"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

export type ToastStatus = "visible" | "exiting" | "hidden";

export interface ToastNotificationProps {
  status: ToastStatus;
  title: string;
  description: string;
  onDismiss: () => void;
}

export function ToastNotification({
  status,
  title,
  description,
  onDismiss,
}: ToastNotificationProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (status === "visible" && !isHovered) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, isHovered, onDismiss]);

  if (status === "hidden") return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 md:right-8 z-50 pointer-events-auto w-[calc(100vw-2rem)] max-w-sm sm:max-w-md transition-all">
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white border-l-4 border-emerald-500 rounded-2xl p-4 shadow-xl border border-slate-100 flex items-start gap-3.5 w-full ${
          status === "exiting"
            ? "animate-toast-out pointer-events-none"
            : "animate-toast-in"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-sm font-heading font-bold text-slate-900 leading-tight">
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

