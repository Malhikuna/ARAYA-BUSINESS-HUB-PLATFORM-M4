export type Role = 'Admin' | 'Partner' | 'Customer' | 'kasir' | 'admin' | 'partner' | 'customer';

export interface JwtPayload {
  sub?: string;
  user_id?: number | string;
  name?: string;
  role: Role | string;
  division?: string;
  unit_usaha_id?: number | string;
  partner_id?: number | string;
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
  name?: string;
  email?: string;
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
