export type AppUserRole = "ADMIN" | "PARTNER_PRODUCT" | "PARTNER_SERVICE";

export type PartnerTipeUsaha = "produk" | "jasa";

export type SidebarIconKey = "catalog" | "users" | "clipboard" | "file" | "receipt" | "truck";

export interface SidebarMenuItemSpec {
  name: string;
  href: string;
  matchPrefix: string;
  iconKey: SidebarIconKey;
}

export interface RouteAccessDecision {
  allowed: boolean;
  redirectTo: string;
  title?: string;
  reason?: string;
}

export interface StoredAuthSession {
  role?: string;
  tipe_usaha?: string | null;
  name?: string;
}

export function normalizeTipeUsaha(raw?: unknown): PartnerTipeUsaha | null {
  if (typeof raw !== "string") return null;
  const val = raw.trim().toLowerCase();
  if (val === "jasa" || val === "service" || val === "services") return "jasa";
  if (val === "produk" || val === "product" || val === "products" || val === "barang") return "produk";
  return null;
}

/**
 * Memetakan payload sesi login M1 + tipe_usaha M3 menjadi role navigasi frontend (3 role dashboard M4).
 */
export function resolveRoleFromAuthSession(session?: StoredAuthSession | null): {
  role: AppUserRole;
  tipeUsaha: PartnerTipeUsaha | null;
} | null {
  if (!session || typeof session.role !== "string") return null;
  const roleLower = session.role.trim().toLowerCase();
  const tipeUsaha = normalizeTipeUsaha(session.tipe_usaha);

  if (roleLower === "partner") {
    if (tipeUsaha === "jasa") return { role: "PARTNER_SERVICE", tipeUsaha: "jasa" };
    return { role: "PARTNER_PRODUCT", tipeUsaha: "produk" };
  }
  if (roleLower === "admin" || roleLower === "administrator" || roleLower === "super_admin") {
    return { role: "ADMIN", tipeUsaha: null };
  }
  return null;
}

/**
 * Menyelaraskan role efektif berdasarkan tipe_usaha Partner (M3).
 * Jika Partner bertipe usaha "produk", role selalu dipaksa menjadi PARTNER_PRODUCT.
 */
export function resolveEffectiveRole(
  role: AppUserRole,
  tipeUsaha?: PartnerTipeUsaha | null
): AppUserRole {
  if (role === "PARTNER_PRODUCT" || role === "PARTNER_SERVICE") {
    if (tipeUsaha === "produk") return "PARTNER_PRODUCT";
    if (tipeUsaha === "jasa") return "PARTNER_SERVICE";
  }
  return role;
}

export function getDefaultRouteForRole(): string {
  return "/produk";
}

/**
 * Daftar menu sidebar adaptif untuk 3 role dashboard M4 (M4-US1-AC3):
 * - Partner Produk (tipe_usaha = produk): Produk, Pelanggan, Invoice, Order (tanpa Permintaan & Penawaran)
 * - Partner Jasa (tipe_usaha = jasa): Jasa, Pelanggan, Permintaan, Penawaran, Invoice, Order
 * - Super Admin: Katalog, Pelanggan
 */
export function getVisibleSidebarMenus(
  role: AppUserRole,
  tipeUsaha?: PartnerTipeUsaha | null
): SidebarMenuItemSpec[] {
  const effectiveRole = resolveEffectiveRole(role, tipeUsaha);

  if (effectiveRole === "PARTNER_PRODUCT") {
    return [
      { name: "Produk", href: "/produk", matchPrefix: "/produk", iconKey: "catalog" },
      { name: "Pelanggan", href: "/pelanggan", matchPrefix: "/pelanggan", iconKey: "users" },
      { name: "Invoice", href: "/invoice", matchPrefix: "/invoice", iconKey: "receipt" },
      { name: "Order", href: "/order", matchPrefix: "/order", iconKey: "truck" },
    ];
  }

  if (effectiveRole === "PARTNER_SERVICE") {
    return [
      { name: "Jasa", href: "/produk", matchPrefix: "/produk", iconKey: "catalog" },
      { name: "Pelanggan", href: "/pelanggan", matchPrefix: "/pelanggan", iconKey: "users" },
      { name: "Permintaan", href: "/permintaan", matchPrefix: "/permintaan", iconKey: "clipboard" },
      { name: "Penawaran", href: "/penawaran", matchPrefix: "/penawaran", iconKey: "file" },
      { name: "Invoice", href: "/invoice", matchPrefix: "/invoice", iconKey: "receipt" },
      { name: "Order", href: "/order", matchPrefix: "/order", iconKey: "truck" },
    ];
  }

  return [
    { name: "Katalog", href: "/produk", matchPrefix: "/produk", iconKey: "catalog" },
    { name: "Pelanggan", href: "/pelanggan", matchPrefix: "/pelanggan", iconKey: "users" },
  ];
}

/**
 * Evaluasi izin akses rute halaman berdasarkan role dan tipe_usaha Partner (M4-US1-AC3 & BR-13).
 */
export function canAccessRoute(
  role: AppUserRole,
  pathname: string,
  tipeUsaha?: PartnerTipeUsaha | null
): RouteAccessDecision {
  const effectiveRole = resolveEffectiveRole(role, tipeUsaha);
  const path = (pathname || "").trim();
  const isPermintaanRoute = path === "/permintaan" || path.startsWith("/permintaan/");
  const isPenawaranRoute = path === "/penawaran" || path.startsWith("/penawaran/");

  if (effectiveRole === "PARTNER_PRODUCT") {
    if (isPermintaanRoute || isPenawaranRoute) {
      return {
        allowed: false,
        redirectTo: "/produk",
        title: "Akses Khusus Partner Jasa",
        reason:
          "Partner Produk tidak memiliki akses ke halaman Permintaan maupun Penawaran sesuai aturan M4-US1-AC3 & BR-13.",
      };
    }
    return { allowed: true, redirectTo: "/produk" };
  }

  if (effectiveRole === "ADMIN" && (isPermintaanRoute || isPenawaranRoute)) {
    return {
      allowed: false,
      redirectTo: "/produk",
      title: "Akses Khusus Partner Jasa",
      reason:
        "Halaman Permintaan dan Penawaran dikhususkan untuk Partner Jasa sesuai aturan BR-13.",
    };
  }

  return { allowed: true, redirectTo: getDefaultRouteForRole() };
}
