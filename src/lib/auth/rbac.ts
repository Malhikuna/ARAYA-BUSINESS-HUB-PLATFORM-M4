import type { Role } from './types';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: Array<Role | string>;
}

// Pola rute publik yang tidak memerlukan otentikasi Bearer JWT
const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/(?:m4\/)?v1\/webhooks\/.*/, // Webhook Midtrans diverifikasi via signature HMAC/SHA-512
  /^\/api\/(?:m4\/)?v1\/health$/,
  /^\/api\/(?:m4\/)?v1\/openapi(?:\.json)?$/,
  /^\/api\/(?:m4\/)?v1\/docs$/,
  /^\/docs$/,
  /^\/api-docs$/,
];

// Matriks otorisasi berbasis peran (RBAC) per rute API (mendukung prefix /api/m4/v1 dan /api/v1)
const ROUTE_RBAC_RULES: RouteRule[] = [
  // Order dari keranjang Modul 5 (Kontrak K-04) khusus Customer
  { pattern: /^\/api\/(?:m4\/)?v1\/orders(?:\/.*)?$/, allowedRoles: ['Customer', 'customer', 'Admin', 'admin'] },

  // Checkout keranjang (legacy compatibility) khusus Customer
  { pattern: /^\/api\/(?:m4\/)?v1\/checkouts(?:\/.*)?$/, allowedRoles: ['Customer', 'customer'] },

  // Pembuatan transaksi pembayaran invoice oleh Customer
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices\/[^/]+\/payments(?:\/.*)?$/, allowedRoles: ['Customer', 'customer', 'Admin', 'admin'] },

  // Master produk (K-05) dapat diakses oleh Admin, Partner, serta modul pemakai
  { pattern: /^\/api\/(?:m4\/)?v1\/products(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner'] },

  // Master pelanggan
  { pattern: /^\/api\/(?:m4\/)?v1\/customers(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner'] },

  // Ringkasan untuk dashboard Modul 2 (Kontrak K-03)
  { pattern: /^\/api\/(?:m4\/)?v1\/dashboard-summary(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner'] },

  // Pembuatan quotation/penawaran oleh Admin dan Partner
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner'] },

  // Konfigurasi sistem dan tarif pajak khusus Admin
  { pattern: /^\/api\/(?:m4\/)?v1\/admin(?:\/.*)?$/, allowedRoles: ['Admin', 'admin'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/tax-rates(?:\/.*)?$/, allowedRoles: ['Admin', 'admin'] },

  // Invoice umum dapat diakses oleh Admin, Partner, maupun Customer
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner', 'Customer', 'customer'] },
];

/**
 * Cek apakah rute API bersifat publik (tanpa bearer JWT)
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Dapatkan daftar peran yang diizinkan untuk suatu path rute
 * Mengembalikan null jika rute cukup memerlukan user yang terotentikasi (semua peran)
 */
export function getAllowedRolesForPath(pathname: string): Array<Role | string> | null {
  for (const rule of ROUTE_RBAC_RULES) {
    if (rule.pattern.test(pathname)) {
      return rule.allowedRoles;
    }
  }
  return null;
}

/**
 * Validasi apakah role pengguna memiliki izin pada daftar role yang diperbolehkan
 */
export function isRoleAuthorized(userRole: Role | string, allowedRoles: Array<Role | string> | null): boolean {
  if (!allowedRoles) {
    return true; // Tidak ada restriksi khusus peran, cukup terautentikasi
  }
  const normalizedUserRole = userRole.toLowerCase();
  return allowedRoles.some((r) => r.toLowerCase() === normalizedUserRole);
}
