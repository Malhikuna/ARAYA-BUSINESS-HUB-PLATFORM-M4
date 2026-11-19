import type { JwtPayload, Role } from './types';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: Array<Role | string>;
}

interface PermissionRule {
  pattern: RegExp;
  methods?: string[];
  anyOf: string[];
}

// Pola rute publik yang tidak memerlukan otentikasi Bearer JWT
const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/(?:m4\/)?v1\/auth\/login$/,
  /^\/api\/(?:m4\/)?v1\/webhooks\/.*/, // Webhook Midtrans diverifikasi via signature HMAC/SHA-512
  /^\/api\/(?:m4\/)?v1\/health$/,
  /^\/api\/(?:m4\/)?v1\/openapi(?:\.json)?$/,
  /^\/api\/(?:m4\/)?v1\/docs$/,
  /^\/docs$/,
  /^\/api-docs$/,
];

// Pemetaan 15 permission m4.* resmi dari JWT Modul 1 v1.1.0 ke rute API M4
const ROUTE_PERMISSION_RULES: PermissionRule[] = [
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations\/[^/]+\/status$/, methods: ['PATCH', 'POST'], anyOf: ['m4.quotations.approve', 'm4.quotations.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations\/[^/]+\/convert$/, methods: ['POST'], anyOf: ['m4.invoices.manage', 'm4.quotations.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.quotations.read', 'm4.quotations.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations(?:\/.*)?$/, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], anyOf: ['m4.quotations.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices\/[^/]+\/payments(?:\/.*)?$/, methods: ['POST', 'PATCH'], anyOf: ['m4.payments.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.invoices.read', 'm4.invoices.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices(?:\/.*)?$/, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], anyOf: ['m4.invoices.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/orders(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.orders.read', 'm4.orders.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/orders(?:\/.*)?$/, methods: ['POST'], anyOf: ['m4.orders.create', 'm4.orders.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/orders(?:\/.*)?$/, methods: ['PUT', 'PATCH', 'DELETE'], anyOf: ['m4.orders.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/products(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.products.read', 'm4.products.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/products(?:\/.*)?$/, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], anyOf: ['m4.products.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/customers(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.customers.read', 'm4.customers.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/customers(?:\/.*)?$/, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], anyOf: ['m4.customers.manage'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/dashboard-summary(?:\/.*)?$/, methods: ['GET'], anyOf: ['m4.reports.read'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/tax-rates(?:\/.*)?$/, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], anyOf: ['m4.taxes.manage'] },
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
  { pattern: /^\/api\/(?:m4\/)?v1\/dashboard-summary(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner', 'manajer'] },

  // Pembuatan quotation/penawaran oleh Admin dan Partner
  { pattern: /^\/api\/(?:m4\/)?v1\/quotations(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner'] },

  // Konfigurasi sistem dan tarif pajak khusus Admin
  { pattern: /^\/api\/(?:m4\/)?v1\/admin(?:\/.*)?$/, allowedRoles: ['Admin', 'admin'] },
  { pattern: /^\/api\/(?:m4\/)?v1\/tax-rates(?:\/.*)?$/, allowedRoles: ['Admin', 'admin'] },

  // Invoice umum dapat diakses oleh Admin, Partner, maupun Customer
  { pattern: /^\/api\/(?:m4\/)?v1\/invoices(?:\/.*)?$/, allowedRoles: ['Admin', 'admin', 'Partner', 'partner', 'Customer', 'customer'] },
];

// Pola rute publik khusus method GET (misal: katalog produk untuk etalase Modul 5)
const PUBLIC_GET_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/(?:m4\/)?v1\/products(?:\/(?!bulk$)[^/]+)?$/,
];

/**
 * Cek apakah rute API bersifat publik (tanpa bearer JWT)
 */
export function isPublicPath(pathname: string, method: string = 'GET'): boolean {
  const upperMethod = method.toUpperCase();
  if (upperMethod === 'OPTIONS') {
    return true;
  }
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }
  if (upperMethod === 'GET' && PUBLIC_GET_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }
  return false;
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
 * Normalisasi kode role dari Modul 1 (misal 'administrator' / 'super_admin' -> 'admin')
 */
function normalizeRoleCode(role: string): string {
  const lower = role.toLowerCase();
  if (lower === 'administrator' || lower === 'super_admin') {
    return 'admin';
  }
  return lower;
}

/**
 * Validasi apakah role pengguna memiliki izin pada daftar role yang diperbolehkan
 */
export function isRoleAuthorized(userRole: Role | string, allowedRoles: Array<Role | string> | null): boolean {
  if (!allowedRoles) {
    return true; // Tidak ada restriksi khusus peran, cukup terautentikasi
  }
  const normalizedUserRole = normalizeRoleCode(String(userRole));
  return allowedRoles.some((r) => normalizeRoleCode(String(r)) === normalizedUserRole);
}

/**
 * Dapatkan daftar permission m4.* (salah satu wajib dimiliki) untuk path & method tertentu.
 */
export function getRequiredPermissionsForPath(pathname: string, method: string): string[] | null {
  const upperMethod = method.toUpperCase();
  for (const rule of ROUTE_PERMISSION_RULES) {
    if (rule.pattern.test(pathname) && (!rule.methods || rule.methods.includes(upperMethod))) {
      return rule.anyOf;
    }
  }
  return null;
}

/**
 * Validasi permission m4.* dari JWT Modul 1 (bypass untuk super admin; fallback ke role jika token tanpa klaim permissions).
 */
export function isPermissionAuthorized(
  payload: Pick<JwtPayload, 'is_super_admin' | 'permissions'>,
  pathname: string,
  method: string
): boolean {
  if (payload.is_super_admin === true) return true;
  if (!Array.isArray(payload.permissions)) return true;

  const required = getRequiredPermissionsForPath(pathname, method);
  if (!required || required.length === 0) return true;

  const owned = new Set(payload.permissions.map((p) => String(p).trim().toLowerCase()));
  return required.some((perm) => owned.has(perm.toLowerCase()));
}
