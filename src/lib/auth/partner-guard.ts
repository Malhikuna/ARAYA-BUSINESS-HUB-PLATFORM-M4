import type { NextResponse } from 'next/server';
import type { PartnerBusinessType } from '../integrations/m3-partner.client';
import {
  PartnerForbiddenError,
  resolveAndVerifyPartnerProfile,
  type ResolvedPartnerProfile,
} from '../services/partner-profile.service';
import { resolveRequestAuthUser } from './guard';
import { createAuthErrorResponse, generateTraceId } from './response';
import type { AuthUser } from './types';

export interface PartnerGuardOptions {
  requiredTipeUsaha?: PartnerBusinessType;
  requireAuth?: boolean;
  traceId?: string;
  m3ApiUrl?: string;
  fetchImpl?: typeof fetch;
}

export type AuthorizePartnerResult =
  | {
      ok: true;
      isAdmin: boolean;
      authUser: AuthUser | null;
      partnerProfile: ResolvedPartnerProfile | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function isAdminRole(role: string): boolean {
  const lower = role.trim().toLowerCase();
  return lower === 'admin' || lower === 'administrator' || lower === 'super_admin';
}

export function isPartnerRole(role: string): boolean {
  return role.trim().toLowerCase() === 'partner';
}

/**
 * Guard otorisasi Partner (via M3 API + fallback lokal partner_profiles) atau Admin.
 * Mengembalikan HTTP 403 amplop standar jika Partner belum terverifikasi atau tipe_usaha tidak sesuai.
 */
export async function authorizePartnerOrAdmin(
  request: Request,
  options: PartnerGuardOptions = {}
): Promise<AuthorizePartnerResult> {
  const traceId = options.traceId || request.headers.get('x-request-id') || generateTraceId();
  const { user, bearerToken, invalidToken } = await resolveRequestAuthUser(request);

  if (invalidToken) {
    return {
      ok: false,
      response: createAuthErrorResponse(
        'UNAUTHENTICATED',
        'Token otentikasi tidak valid atau telah kedaluwarsa.',
        traceId,
        401
      ),
    };
  }

  if (!user) {
    if (options.requireAuth) {
      return {
        ok: false,
        response: createAuthErrorResponse('UNAUTHENTICATED', 'Autentikasi diperlukan.', traceId, 401),
      };
    }
    return { ok: true, isAdmin: false, authUser: null, partnerProfile: null };
  }

  if (isAdminRole(user.role)) {
    return { ok: true, isAdmin: true, authUser: user, partnerProfile: null };
  }

  if (!isPartnerRole(user.role)) {
    return {
      ok: false,
      response: createAuthErrorResponse(
        'FORBIDDEN',
        'Peran pengguna tidak memiliki akses ke resource ini.',
        traceId,
        403
      ),
    };
  }

  try {
    const partnerProfile = await resolveAndVerifyPartnerProfile(user, {
      bearerToken,
      m3ApiUrl: options.m3ApiUrl,
      fetchImpl: options.fetchImpl,
    });

    if (options.requiredTipeUsaha && partnerProfile.tipe_usaha !== options.requiredTipeUsaha) {
      const label = options.requiredTipeUsaha === 'jasa' ? 'Jasa' : 'Produk';
      return {
        ok: false,
        response: createAuthErrorResponse(
          'FORBIDDEN',
          `Akses ditolak. Fitur ini khusus Partner ${label} terverifikasi.`,
          traceId,
          403
        ),
      };
    }

    return { ok: true, isAdmin: false, authUser: user, partnerProfile };
  } catch (error) {
    if (error instanceof PartnerForbiddenError) {
      return {
        ok: false,
        response: createAuthErrorResponse('FORBIDDEN', error.message, traceId, 403),
      };
    }
    throw error;
  }
}

/**
 * Guard khusus Partner Jasa terverifikasi (atau Admin) untuk Permintaan Jasa & Penawaran.
 */
export async function requireServicePartner(
  request: Request,
  options: Omit<PartnerGuardOptions, 'requiredTipeUsaha'> = {}
): Promise<AuthorizePartnerResult> {
  return authorizePartnerOrAdmin(request, {
    ...options,
    requiredTipeUsaha: 'jasa',
  });
}
