import type { Role } from './types';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: Role[];
}

// Pola rute publik yang tidak memerlukan otentikasi Bearer JWT
const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/v1\/webhooks\/.*/, // Webhook Midtrans diverifikasi via signature HMAC/SHA-512
  /^\/api\/v1\/health$/,
];

// Matriks otorisasi berbasis peran (RBAC) per prefix rute API
const ROUTE_RBAC_RULES: RouteRule[] = [
  // Checkout keranjang dari M5 khusus untuk Customer yang sedang login
  { pattern: /^\/api\/v1\/checkouts(\/.*)?$/, allowedRoles: ['Customer'] },

  // Pembuatan transaksi pembayaran invoice oleh Customer
  { pattern: /^\/api\/v1\/invoices\/[^/]+\/payments(\/.*)?$/, allowedRoles: ['Customer'] },

  // Pengelolaan master produk dan pelanggan oleh Admin dan Partner
  { pattern: /^\/api\/v1\/products(\/.*)?$/, allowedRoles: ['Admin', 'Partner'] },
  { pattern: /^\/api\/v1\/customers(\/.*)?$/, allowedRoles: ['Admin', 'Partner'] },

  // Pembuatan quotation/penawaran oleh Admin dan Partner
  { pattern: /^\/api\/v1\/quotations(\/.*)?$/, allowedRoles: ['Admin', 'Partner'] },

  // Konfigurasi sistem dan tarif pajak khusus Admin
  { pattern: /^\/api\/v1\/admin(\/.*)?$/, allowedRoles: ['Admin'] },
  { pattern: /^\/api\/v1\/tax-rates(\/.*)?$/, allowedRoles: ['Admin'] },

  // Invoice umum dapat diakses oleh Admin, Partner, maupun Customer (dengan filter ID)
  { pattern: /^\/api\/v1\/invoices(\/.*)?$/, allowedRoles: ['Admin', 'Partner', 'Customer'] },
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
export function getAllowedRolesForPath(pathname: string): Role[] | null {
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
export function isRoleAuthorized(userRole: Role, allowedRoles: Role[] | null): boolean {
  if (!allowedRoles) {
    return true; // Tidak ada restriksi khusus peran, cukup terautentikasi
  }
  return allowedRoles.includes(userRole);
}
