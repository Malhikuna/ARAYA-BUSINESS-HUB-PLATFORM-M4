export type Role =
  | 'Admin'
  | 'Partner'
  | 'Customer'
  | 'kasir'
  | 'admin'
  | 'partner'
  | 'customer'
  | 'administrator'
  | 'super_admin'
  | 'manajer';

export interface JwtPayload {
  sub?: string;
  user_id?: number | string;
  name?: string;
  role: Role | string;
  division?: string | null;
  unit_usaha_id?: number | string | null;
  partner_id?: number | string | null;
  is_super_admin?: boolean;
  permissions?: string[];
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface AuthUser {
  userId: string;
  role: Role | string;
  partnerId?: string;
  unitUsahaId?: number;
  division?: string | null;
  isSuperAdmin?: boolean;
  permissions?: string[];
  name?: string;
  email?: string;
  tipeUsaha?: 'produk' | 'jasa';
  isVerified?: boolean;
}

export interface UniformErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string> | null;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface UniformSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}
