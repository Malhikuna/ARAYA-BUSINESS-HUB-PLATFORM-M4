"use client";

import { useSyncExternalStore } from "react";

const AUTH_SESSION_KEY = "araya_auth_session";
const DEV_ACTIVE_ROLE_KEY = "araya_dev_active_role";
const CUSTOMER_PREVIEW_KEY = "araya_quotation_customer_preview";
const CUSTOMER_PREVIEW_EVENT = "araya-customer-preview-change";

export interface QuotationViewerSnapshot {
  isDevSwitcherEnabled: boolean;
  devActiveRole: string | null;
  authSessionRole: string | null;
  customerPreviewEnabled: boolean;
}

/**
 * Fungsi murni penentu apakah penampil halaman /penawaran saat ini adalah Customer M1 (UC-05).
 */
export function isCustomerViewerFromSnapshot(snapshot: QuotationViewerSnapshot): boolean {
  if (snapshot.isDevSwitcherEnabled) {
    if (snapshot.devActiveRole === "CUSTOMER") return true;
    if (snapshot.customerPreviewEnabled) return true;
  }
  return String(snapshot.authSessionRole || "").trim().toLowerCase() === "customer";
}

function subscribeViewerMode(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("araya-dev-role-change", callback);
  window.addEventListener(CUSTOMER_PREVIEW_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-dev-role-change", callback);
    window.removeEventListener(CUSTOMER_PREVIEW_EVENT, callback);
  };
}

function readViewerSnapshotKey(): string {
  if (typeof window === "undefined") return "0|||0";
  const isDev = process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true" ? "1" : "0";
  let devRole = "";
  let sessionRole = "";
  let preview = "0";
  try {
    devRole = localStorage.getItem(DEV_ACTIVE_ROLE_KEY) || "";
    const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (rawSession) {
      const parsed = JSON.parse(rawSession) as { role?: unknown };
      if (typeof parsed?.role === "string") sessionRole = parsed.role;
    }
    preview = sessionStorage.getItem(CUSTOMER_PREVIEW_KEY) === "true" ? "1" : "0";
  } catch {
    /* ignore storage error */
  }
  return `${isDev}|${devRole}|${sessionRole}|${preview}`;
}

const getServerSnapshotKey = () => "0|||0";

export function setDevCustomerPreview(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      sessionStorage.setItem(CUSTOMER_PREVIEW_KEY, "true");
    } else {
      sessionStorage.removeItem(CUSTOMER_PREVIEW_KEY);
    }
    window.dispatchEvent(new Event(CUSTOMER_PREVIEW_EVENT));
  } catch {
    /* ignore storage error */
  }
}

/**
 * Hook non-konflik (terpisah dari dev-role.ts) untuk mendeteksi tampilan Customer login M1
 * baik dari sesi JWT/M1 maupun switcher/pratinjau dev lokal.
 */
export function useQuotationViewerMode() {
  const snapshotKey = useSyncExternalStore(
    subscribeViewerMode,
    readViewerSnapshotKey,
    getServerSnapshotKey
  );
  const [isDevFlag, devActiveRole, authSessionRole, previewFlag] = snapshotKey.split("|");
  const isDevSwitcherEnabled = isDevFlag === "1";
  const isCustomer = isCustomerViewerFromSnapshot({
    isDevSwitcherEnabled,
    devActiveRole: devActiveRole || null,
    authSessionRole: authSessionRole || null,
    customerPreviewEnabled: previewFlag === "1",
  });
  const isLockedByRoleSwitcher = isDevSwitcherEnabled && devActiveRole === "CUSTOMER";

  return {
    isCustomer,
    isDevPreviewAvailable: isDevSwitcherEnabled && !isLockedByRoleSwitcher,
    toggleCustomerPreview: (next: boolean) => setDevCustomerPreview(next),
  };
}
