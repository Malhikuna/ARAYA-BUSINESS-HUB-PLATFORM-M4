"use client";

import { useSyncExternalStore } from "react";

const AUTH_SESSION_KEY = "araya_auth_session";
const DEV_ACTIVE_ROLE_KEY = "araya_dev_active_role";
const CUSTOMER_PORTAL_PREVIEW_KEY = "araya_customer_portal_preview";
const CUSTOMER_PORTAL_EVENT = "araya-customer-portal-change";

export const DEFAULT_CUSTOMER_M1_USER_ID = "20000000-0000-0000-0000-000000000017";
export const DEFAULT_CUSTOMER_M1_NAME = "Budi Santoso";
export const DEFAULT_CUSTOMER_M1_COMPANY = "PT Maju Bersama";

export interface CustomerPortalSnapshot {
  isDevSwitcherEnabled: boolean;
  devActiveRole: string | null;
  authSessionRole: string | null;
  authSessionUserId: string | null;
  authSessionName: string | null;
  customerPreviewEnabled: boolean;
}

export function resolveCustomerPortalFromSnapshot(snapshot: CustomerPortalSnapshot): {
  isCustomer: boolean;
  customerUserId: string;
  customerDisplayName: string;
} {
  const isSessionCustomer =
    String(snapshot.authSessionRole || "").trim().toLowerCase() === "customer";
  const isDevCustomer =
    snapshot.isDevSwitcherEnabled &&
    (snapshot.devActiveRole === "CUSTOMER" || snapshot.customerPreviewEnabled);

  return {
    isCustomer: isSessionCustomer || isDevCustomer,
    customerUserId: snapshot.authSessionUserId?.trim() || DEFAULT_CUSTOMER_M1_USER_ID,
    customerDisplayName: snapshot.authSessionName?.trim() || DEFAULT_CUSTOMER_M1_NAME,
  };
}

function subscribePortal(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("araya-dev-role-change", callback);
  window.addEventListener(CUSTOMER_PORTAL_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-dev-role-change", callback);
    window.removeEventListener(CUSTOMER_PORTAL_EVENT, callback);
  };
}

function readSnapshotKey(): string {
  if (typeof window === "undefined") return "0|||||0";
  const isDev = process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true" ? "1" : "0";
  let devRole = "";
  let sessionRole = "";
  let sessionUserId = "";
  let sessionName = "";
  let preview = "0";
  try {
    devRole = localStorage.getItem(DEV_ACTIVE_ROLE_KEY) || "";
    const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (rawSession) {
      const parsed = JSON.parse(rawSession) as {
        role?: unknown;
        user_id?: unknown;
        sub?: unknown;
        name?: unknown;
      };
      if (typeof parsed?.role === "string") sessionRole = parsed.role;
      if (typeof parsed?.user_id === "string" || typeof parsed?.user_id === "number") {
        sessionUserId = String(parsed.user_id);
      } else if (typeof parsed?.sub === "string") {
        sessionUserId = parsed.sub;
      }
      if (typeof parsed?.name === "string") sessionName = parsed.name;
    }
    preview = sessionStorage.getItem(CUSTOMER_PORTAL_PREVIEW_KEY) === "true" ? "1" : "0";
  } catch {
    /* ignore storage error */
  }
  return `${isDev}|${devRole}|${sessionRole}|${sessionUserId}|${sessionName}|${preview}`;
}

const getServerSnapshotKey = () => "0|||||0";

export function setCustomerPortalPreview(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      sessionStorage.setItem(CUSTOMER_PORTAL_PREVIEW_KEY, "true");
    } else {
      sessionStorage.removeItem(CUSTOMER_PORTAL_PREVIEW_KEY);
    }
    window.dispatchEvent(new Event(CUSTOMER_PORTAL_EVENT));
  } catch {
    /* ignore storage error */
  }
}

export function useCustomerPortalMode() {
  const key = useSyncExternalStore(subscribePortal, readSnapshotKey, getServerSnapshotKey);
  const [isDevFlag, devActiveRole, authSessionRole, authSessionUserId, authSessionName, previewFlag] =
    key.split("|");
  const isDevSwitcherEnabled = isDevFlag === "1";
  const resolved = resolveCustomerPortalFromSnapshot({
    isDevSwitcherEnabled,
    devActiveRole: devActiveRole || null,
    authSessionRole: authSessionRole || null,
    authSessionUserId: authSessionUserId || null,
    authSessionName: authSessionName || null,
    customerPreviewEnabled: previewFlag === "1",
  });
  const isLockedByRoleSwitcher = isDevSwitcherEnabled && devActiveRole === "CUSTOMER";

  return {
    ...resolved,
    isDevPreviewAvailable: isDevSwitcherEnabled && !isLockedByRoleSwitcher,
    toggleCustomerPreview: (next: boolean) => setCustomerPortalPreview(next),
  };
}
