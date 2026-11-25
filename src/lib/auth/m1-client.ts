import type { JwtPayload } from './types';

export const DEFAULT_M1_API_URL =
  process.env.M1_API_URL || 'https://ppl-m1-be.vercel.app/api/m1/v1';

export interface M1ClientOptions {
  m1ApiUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface M1ProxyResult<T = unknown> {
  status: number;
  body:
    | { success: true; data: T }
    | {
        success: false;
        error: { code: string; message: string; fields?: Record<string, string> | null };
      };
}

interface M1MeResponse {
  success?: boolean;
  data?: {
    user_id?: number | string;
    name?: string;
    role?: string;
    division?: string | null;
    partner_id?: number | string | null;
    unit_usaha_id?: number | string | null;
    is_super_admin?: boolean;
    email?: string;
  };
}

function getBaseUrl(options?: M1ClientOptions): string {
  return (options?.m1ApiUrl ?? DEFAULT_M1_API_URL).trim().replace(/\/+$/, '');
}

function normalizeErrorBody(raw: unknown, fallbackMessage: string) {
  if (raw && typeof raw === 'object' && 'error' in raw) {
    const err = (raw as { error?: Record<string, unknown> }).error;
    if (err && typeof err === 'object') {
      return {
        success: false as const,
        error: {
          code: typeof err.code === 'string' ? err.code : 'M1_AUTH_ERROR',
          message: typeof err.message === 'string' ? err.message : fallbackMessage,
          fields: (err.fields as Record<string, string> | null | undefined) ?? null,
        },
      };
    }
  }
  return {
    success: false as const,
    error: { code: 'M1_AUTH_ERROR', message: fallbackMessage, fields: null },
  };
}

/**
 * Verifikasi Bearer token ke Modul 1 via Kontrak K-01 (GET /api/m1/v1/me)
 */
export async function fetchMeFromM1(
  token: string,
  options?: M1ClientOptions
): Promise<JwtPayload | null> {
  const fetchFn = options?.fetchImpl ?? fetch;
  try {
    const res = await fetchFn(`${getBaseUrl(options)}/me`, {
      method: 'GET',
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(options?.timeoutMs ?? 3500),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as M1MeResponse;
    if (!body?.success || !body.data || body.data.user_id === undefined) {
      return null;
    }

    const { user_id, name, role, division, partner_id, unit_usaha_id, is_super_admin, email } =
      body.data;

    return {
      sub: String(user_id),
      user_id,
      name,
      role: role || (is_super_admin ? 'administrator' : 'partner'),
      division: division ?? null,
      partner_id: partner_id ?? null,
      unit_usaha_id: unit_usaha_id ?? null,
      is_super_admin: Boolean(is_super_admin),
      email,
    };
  } catch {
    return null;
  }
}

/**
 * Proxy login ke Modul 1 (POST /api/m1/v1/auth/login)
 */
export async function loginWithM1(
  email: string,
  password: string,
  options?: M1ClientOptions
): Promise<M1ProxyResult<{ access_token: string; token_type: string; expires_in: number }>> {
  const fetchFn = options?.fetchImpl ?? fetch;
  try {
    const res = await fetchFn(`${getBaseUrl(options)}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(options?.timeoutMs ?? 5000),
    });

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !json || json.success !== true || !json.data) {
      return {
        status: res.ok ? 502 : res.status,
        body: normalizeErrorBody(json, 'Email atau kata sandi tidak valid.'),
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        data: json.data as { access_token: string; token_type: string; expires_in: number },
      },
    };
  } catch {
    return {
      status: 502,
      body: {
        success: false,
        error: {
          code: 'M1_UNAVAILABLE',
          message: 'Layanan otentikasi Modul 1 sedang tidak dapat dijangkau.',
          fields: null,
        },
      },
    };
  }
}

/**
 * Proxy logout ke Modul 1 (POST /api/m1/v1/auth/sessions/logout) untuk mencabut jti token
 */
export async function logoutWithM1(
  token: string,
  options?: M1ClientOptions
): Promise<M1ProxyResult<{ logged_out: boolean }>> {
  const fetchFn = options?.fetchImpl ?? fetch;
  try {
    const res = await fetchFn(`${getBaseUrl(options)}/auth/sessions/logout`, {
      method: 'POST',
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(options?.timeoutMs ?? 5000),
    });

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      return {
        status: res.status,
        body: normalizeErrorBody(json, 'Gagal keluar dari sesi Modul 1.'),
      };
    }

    return {
      status: 200,
      body: { success: true, data: { logged_out: true } },
    };
  } catch {
    return {
      status: 502,
      body: {
        success: false,
        error: {
          code: 'M1_UNAVAILABLE',
          message: 'Layanan otentikasi Modul 1 sedang tidak dapat dijangkau.',
          fields: null,
        },
      },
    };
  }
}
