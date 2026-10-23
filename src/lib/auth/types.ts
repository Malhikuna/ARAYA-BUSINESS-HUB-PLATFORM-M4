export type Role = 'Admin' | 'Partner' | 'Customer';

export interface JwtPayload {
  sub: string;
  role: Role;
  partner_id?: string;
  email?: string;
  business_unit_id?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface AuthUser {
  userId: string;
  role: Role;
  partnerId?: string;
  email?: string;
}

export interface UniformErrorResponse {
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | string;
    message: string;
    details: Array<{ field?: string; issue: string }>;
    trace_id: string;
  };
}
