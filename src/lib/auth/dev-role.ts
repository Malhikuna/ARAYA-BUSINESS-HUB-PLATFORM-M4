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
    description: "Kelola Produk, Pelanggan, Invoice & Order",
  },
  PARTNER_SERVICE: {
    id: "PARTNER_SERVICE",
    name: "Rani K.",
    roleLabel: "Partner Jasa",
    catalogMenuName: "Jasa",
    businessMode: "Jasa",
    description: "Kelola Jasa, Pelanggan, Permintaan, Penawaran, Invoice & Order",
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
  source?: "Input partner" | "Akun customer";
}

export interface DevPartnerOption {
  id: string;
  name: string;
  type: "Produk" | "Jasa";
  city: string;
}

export const DEV_PARTNER_OPTIONS: DevPartnerOption[] = [
  { id: "PRT-PRD-01", name: "Mitra Retail Nusantara", type: "Produk", city: "Bandung" },
  { id: "PRT-PRD-02", name: "CV Sumber Makmur Distribusi", type: "Produk", city: "Jakarta" },
  { id: "PRT-PRD-03", name: "PT Sentosa Elektronik Indonesia", type: "Produk", city: "Surabaya" },
  { id: "PRT-PRD-04", name: "UD Berkah Jaya Abadi", type: "Produk", city: "Semarang" },
  { id: "PRT-PRD-05", name: "PT Global Niaga Mandiri", type: "Produk", city: "Bandung" },
  { id: "PRT-SRV-01", name: "Studio Kreasi Mandiri", type: "Jasa", city: "Bandung" },
  { id: "PRT-SRV-02", name: "PT Solusi Digital Nusantara", type: "Jasa", city: "Jakarta" },
  { id: "PRT-SRV-03", name: "Biro Konsultan Prima Strategi", type: "Jasa", city: "Bandung" },
  { id: "PRT-SRV-04", name: "CV Teknika Layanan Terpadu", type: "Jasa", city: "Yogyakarta" },
  { id: "PRT-SRV-05", name: "Agensi Visual Kreatif Karsa", type: "Jasa", city: "Surabaya" },
];

const CUSTOMER_PARTNER_STORAGE_KEY = "araya_dev_customer_partners";
const PRODUCT_PARTNER_STORAGE_KEY = "araya_dev_product_partners";

export function saveCustomerPartnerAssignment(
  customerName: string,
  partnerName: string,
  partnerType: "Produk" | "Jasa",
  source: "Input partner" | "Akun customer" = "Input partner"
): void {
  if (typeof window === "undefined" || !customerName.trim() || !partnerName.trim()) return;
  try {
    const raw = localStorage.getItem(CUSTOMER_PARTNER_STORAGE_KEY);
    const map: Record<string, CustomerPartnerInfo> = raw ? JSON.parse(raw) : {};
    map[customerName.trim().toLowerCase()] = {
      partnerRole: partnerType === "Jasa" ? "PARTNER_SERVICE" : "PARTNER_PRODUCT",
      partnerName: partnerName.trim(),
      partnerType,
      source,
    };
    localStorage.setItem(CUSTOMER_PARTNER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage error */
  }
}

export function getCustomerPartnerInfo(customerName: string): CustomerPartnerInfo {
  const key = (customerName || "").trim().toLowerCase();
  if (typeof window !== "undefined" && key) {
    try {
      const raw = localStorage.getItem(CUSTOMER_PARTNER_STORAGE_KEY);
      if (raw) {
        const map: Record<string, CustomerPartnerInfo> = JSON.parse(raw);
        if (map[key]) {
          return {
            ...map[key],
            source: map[key].source || "Input partner",
          };
        }
      }
    } catch {
      /* ignore storage error */
    }
  }
  const isAccountCustomer = key.includes("maju bersama") || key.includes("budi santoso") || key.includes("dudi santoso");
  if (
    isAccountCustomer ||
    key.includes("murdo") ||
    key.includes("karya mandiri") ||
    key.includes("mega logistik") ||
    key.includes("sukses berkah")
  ) {
    return {
      partnerRole: "PARTNER_SERVICE",
      partnerName: "Studio Kreasi Mandiri",
      partnerType: "Jasa",
      source: isAccountCustomer ? "Akun customer" : "Input partner",
    };
  }
  return {
    partnerRole: "PARTNER_PRODUCT",
    partnerName: "Mitra Retail Nusantara",
    partnerType: "Produk",
    source: "Input partner",
  };
}

export function saveProductPartnerAssignment(
  productName: string,
  partnerName: string,
  partnerType: "Produk" | "Jasa"
): void {
  if (typeof window === "undefined" || !productName.trim() || !partnerName.trim()) return;
  try {
    const raw = localStorage.getItem(PRODUCT_PARTNER_STORAGE_KEY);
    const map: Record<string, CustomerPartnerInfo> = raw ? JSON.parse(raw) : {};
    map[productName.trim().toLowerCase()] = {
      partnerRole: partnerType === "Jasa" ? "PARTNER_SERVICE" : "PARTNER_PRODUCT",
      partnerName: partnerName.trim(),
      partnerType,
    };
    localStorage.setItem(PRODUCT_PARTNER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage error */
  }
}

export function getProductPartnerInfo(
  productName: string,
  category: "Produk" | "Jasa" = "Produk"
): CustomerPartnerInfo {
  const key = (productName || "").trim().toLowerCase();
  if (typeof window !== "undefined" && key) {
    try {
      const raw = localStorage.getItem(PRODUCT_PARTNER_STORAGE_KEY);
      if (raw) {
        const map: Record<string, CustomerPartnerInfo> = JSON.parse(raw);
        if (map[key]) return map[key];
      }
    } catch {
      /* ignore storage error */
    }
  }
  if (category === "Jasa") {
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

