"use client";

import { useSyncExternalStore } from "react";
import { BusinessMode } from "@/types/product";
import {
  AppUserRole,
  PartnerTipeUsaha,
  StoredAuthSession,
  normalizeTipeUsaha,
  resolveEffectiveRole,
  resolveRoleFromAuthSession,
} from "@/lib/auth/navigation-access";

export type DevUserRole = AppUserRole;

export interface DevRoleProfile {
  id: DevUserRole;
  name: string;
  roleLabel: string;
  catalogMenuName: string;
  businessMode: BusinessMode;
  tipeUsaha: PartnerTipeUsaha | null;
  description: string;
}

export const AUTH_SESSION_STORAGE_KEY = "araya_auth_session";
export const PARTNER_TIPE_USAHA_STORAGE_KEY = "araya_partner_tipe_usaha";

export const DEV_ROLE_PROFILES: Record<DevUserRole, DevRoleProfile> = {
  ADMIN: {
    id: "ADMIN",
    name: "Rani K.",
    roleLabel: "Super Admin",
    catalogMenuName: "Katalog",
    businessMode: "Semua",
    tipeUsaha: null,
    description: "Kelola Master Katalog & Pelanggan",
  },
  PARTNER_PRODUCT: {
    id: "PARTNER_PRODUCT",
    name: "Rani K.",
    roleLabel: "Partner Produk",
    catalogMenuName: "Produk",
    businessMode: "Produk",
    tipeUsaha: "produk",
    description: "Kelola Produk, Pelanggan, Invoice & Order",
  },
  PARTNER_SERVICE: {
    id: "PARTNER_SERVICE",
    name: "Rani K.",
    roleLabel: "Partner Jasa",
    catalogMenuName: "Jasa",
    businessMode: "Jasa",
    tipeUsaha: "jasa",
    description: "Kelola Jasa, Pelanggan, Permintaan, Penawaran, Invoice & Order",
  },
  CUSTOMER: {
    id: "CUSTOMER",
    name: "Budi Santoso",
    roleLabel: "Customer",
    catalogMenuName: "Penawaran",
    businessMode: "Semua",
    tipeUsaha: null,
    description: "Lihat Penawaran, Invoice saya & Pesanan saya",
  },
};

export function subscribeDevRole(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("araya-dev-role-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-dev-role-change", callback);
  };
}

function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as StoredAuthSession;
    }
  } catch {
    /* ignore corrupt session storage */
  }
  return null;
}

export function getStoredDevRole(): DevUserRole {
  if (typeof window === "undefined") return "ADMIN";
  try {
    const stored = localStorage.getItem("araya_dev_active_role");
    if (
      stored === "ADMIN" ||
      stored === "PARTNER_PRODUCT" ||
      stored === "PARTNER_SERVICE" ||
      stored === "CUSTOMER"
    ) {
      return stored;
    }
  } catch {
    /* ignore localStorage error */
  }
  return "ADMIN";
}

function getStoredPartnerTipeUsahaSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    const direct = normalizeTipeUsaha(localStorage.getItem(PARTNER_TIPE_USAHA_STORAGE_KEY));
    if (direct) return direct;
    const session = readStoredAuthSession();
    return normalizeTipeUsaha(session?.tipe_usaha) || "";
  } catch {
    return "";
  }
}

function getStoredSessionRoleSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return raw || "";
  } catch {
    return "";
  }
}

export const getServerStoredDevRole = (): DevUserRole => "ADMIN";
const getServerEmptyString = (): string => "";

export function setStoredDevRole(role: DevUserRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("araya_dev_active_role", role);
    const profile = DEV_ROLE_PROFILES[role];
    localStorage.setItem("araya_business_mode", profile.businessMode);
    if (profile.tipeUsaha) {
      localStorage.setItem(PARTNER_TIPE_USAHA_STORAGE_KEY, profile.tipeUsaha);
    } else {
      localStorage.removeItem(PARTNER_TIPE_USAHA_STORAGE_KEY);
    }
    window.dispatchEvent(new Event("araya-dev-role-change"));
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch {
    /* ignore localStorage error */
  }
}

export function useDevRole() {
  const isDev = process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true";
  const devRole = useSyncExternalStore(subscribeDevRole, getStoredDevRole, getServerStoredDevRole);
  const rawTipeUsaha = useSyncExternalStore(
    subscribeDevRole,
    getStoredPartnerTipeUsahaSnapshot,
    getServerEmptyString
  );
  const rawSession = useSyncExternalStore(
    subscribeDevRole,
    getStoredSessionRoleSnapshot,
    getServerEmptyString
  );

  let sessionResolved: { role: DevUserRole; tipeUsaha: PartnerTipeUsaha | null } | null = null;
  let sessionName: string | undefined;
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as StoredAuthSession;
      sessionResolved = resolveRoleFromAuthSession(parsed);
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        sessionName = parsed.name.trim();
      }
    } catch {
      sessionResolved = null;
    }
  }

  const storedTipeUsaha = normalizeTipeUsaha(rawTipeUsaha);
  const baseRole: DevUserRole = isDev ? devRole : sessionResolved?.role ?? "ADMIN";
  const tipeUsaha: PartnerTipeUsaha | null = isDev
    ? DEV_ROLE_PROFILES[baseRole].tipeUsaha ?? storedTipeUsaha
    : sessionResolved?.tipeUsaha ?? (baseRole === "PARTNER_PRODUCT" || baseRole === "PARTNER_SERVICE" ? storedTipeUsaha ?? DEV_ROLE_PROFILES[baseRole].tipeUsaha : null);

  const activeRole: DevUserRole = resolveEffectiveRole(baseRole, tipeUsaha);
  const baseProfile = DEV_ROLE_PROFILES[activeRole];
  const profile: DevRoleProfile =
    !isDev && sessionName ? { ...baseProfile, name: sessionName } : baseProfile;

  const switchRole = (newRole: DevUserRole) => {
    if (!isDev) return;
    setStoredDevRole(newRole);
  };

  return { isDev, activeRole, tipeUsaha, profile, switchRole };
}

export interface CustomerPartnerInfo {
  partnerRole: "PARTNER_PRODUCT" | "PARTNER_SERVICE";
  partnerName: string;
  partnerType: "Produk" | "Jasa";
}

export function getCustomerPartnerInfo(customerName: string): CustomerPartnerInfo {
  const lower = (customerName || "").toLowerCase();
  if (lower.includes("murdo") || lower.includes("karya mandiri")) {
    return {
      partnerRole: "PARTNER_SERVICE",
      partnerName: "Studio Kreasi Mandiri",
      partnerType: "Jasa",
    };
  }
  return {
    partnerRole: "PARTNER_PRODUCT",
    partnerName: "Mitra Retail Nusantara",
    partnerType: "Produk",
  };
}
