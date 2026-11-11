"use client";

import { useSyncExternalStore } from "react";
import { BusinessMode } from "@/types/product";

export type DevUserRole = "ADMIN" | "PARTNER_PRODUCT" | "PARTNER_SERVICE";

export interface DevRoleProfile {
  id: DevUserRole;
  name: string;
  roleLabel: string;
  catalogMenuName: string;
  businessMode: BusinessMode;
  description: string;
}

export const DEV_ROLE_PROFILES: Record<DevUserRole, DevRoleProfile> = {
  ADMIN: {
    id: "ADMIN",
    name: "Rani K.",
    roleLabel: "Super Admin",
    catalogMenuName: "Katalog",
    businessMode: "Semua",
    description: "Kelola Master Katalog & Pelanggan",
  },
  PARTNER_PRODUCT: {
    id: "PARTNER_PRODUCT",
    name: "Rani K.",
    roleLabel: "Partner Produk",
    catalogMenuName: "Produk",
    businessMode: "Produk",
    description: "Kelola Produk, Penawaran, Invoice & Order",
  },
  PARTNER_SERVICE: {
    id: "PARTNER_SERVICE",
    name: "Rani K.",
    roleLabel: "Partner Jasa",
    catalogMenuName: "Jasa",
    businessMode: "Jasa",
    description: "Kelola Jasa, Penawaran, Invoice & Order",
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

export function getStoredDevRole(): DevUserRole {
  if (typeof window === "undefined") return "ADMIN";
  try {
    const stored = localStorage.getItem("araya_dev_active_role");
    if (stored === "ADMIN" || stored === "PARTNER_PRODUCT" || stored === "PARTNER_SERVICE") {
      return stored;
    }
  } catch {
    /* ignore localStorage error */
  }
  return "ADMIN";
}

export const getServerStoredDevRole = (): DevUserRole => "ADMIN";

export function setStoredDevRole(role: DevUserRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("araya_dev_active_role", role);
    const profile = DEV_ROLE_PROFILES[role];
    localStorage.setItem("araya_business_mode", profile.businessMode);
    window.dispatchEvent(new Event("araya-dev-role-change"));
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch {
    /* ignore localStorage error */
  }
}

export function useDevRole() {
  const isDev = process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true";
  const role = useSyncExternalStore(subscribeDevRole, getStoredDevRole, getServerStoredDevRole);
  const activeRole: DevUserRole = isDev ? role : "ADMIN";
  const profile = DEV_ROLE_PROFILES[activeRole];

  const switchRole = (newRole: DevUserRole) => {
    if (!isDev) return;
    setStoredDevRole(newRole);
  };

  return { isDev, activeRole, profile, switchRole };
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

