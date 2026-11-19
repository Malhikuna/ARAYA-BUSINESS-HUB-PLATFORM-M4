import { verifyJwt } from './jwt';
import { normalizePartnerBusinessType } from '../integrations/m3-partner.client';
import type { AuthUser, Role } from './types';

export interface ResolvedAuthResult {
  user: AuthUser | null;
  bearerToken?: string;
  invalidToken?: boolean;
}

/**
 * Ekstrak token Bearer dari header Authorization bila tersedia.
 */
export function extractBearerToken(request: Request): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authHeader.substring(7).trim();
  return token || undefined;
}

/**
 * Ekstrak data otentikasi pengguna yang diteruskan oleh Middleware/Proxy ke header internal
 */
export function getAuthUser(request: Request): AuthUser | null {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as Role | null;

  if (!userId || !role) {
    return null;
  }

  const partnerId = request.headers.get('x-partner-id') || undefined;
  const rawUnitUsahaId = request.headers.get('x-unit-usaha-id');
  const parsedUnitUsahaId = rawUnitUsahaId ? Number(rawUnitUsahaId) : NaN;
  const unitUsahaId = Number.isFinite(parsedUnitUsahaId) ? parsedUnitUsahaId : undefined;
  const division = request.headers.get('x-user-division') || null;
  const isSuperAdmin = request.headers.get('x-user-super-admin') === 'true';
  const rawPermissions = request.headers.get('x-user-permissions');
  const permissions = rawPermissions
    ? rawPermissions.split(',').map((p) => p.trim()).filter(Boolean)
    : undefined;
  const name = request.headers.get('x-user-name') || undefined;
  const email = request.headers.get('x-user-email') || undefined;

  return {
    userId,
    role,
    partnerId,
    unitUsahaId,
    division,
    isSuperAdmin,
    permissions,
    name,
    email,
  };
}

/**
 * Resolusi konteks pengguna dari header proxy (x-user-*) terlebih dahulu,
 * lalu fallback ke verifikasi Authorization: Bearer <token> (untuk rute publik
 * seperti GET /products atau pemanggilan route handler langsung pada unit test).
 */
export async function resolveRequestAuthUser(request: Request): Promise<ResolvedAuthResult> {
  const bearerToken = extractBearerToken(request);
  const headerUser = getAuthUser(request);
  if (headerUser) {
    return { user: headerUser, bearerToken };
  }

  if (!bearerToken) {
    return { user: null };
  }

  const verification = await verifyJwt(bearerToken);
  if (!verification.valid || !verification.payload) {
    return { user: null, bearerToken, invalidToken: true };
  }

  const { payload } = verification;
  const userId = String(payload.user_id ?? payload.sub ?? '');
  if (!userId || !payload.role) {
    return { user: null, bearerToken, invalidToken: true };
  }

  const tipeUsaha = normalizePartnerBusinessType(payload.tipe_usaha) ?? undefined;
  const isVerified = typeof payload.is_verified === 'boolean' ? payload.is_verified : undefined;

  return {
    user: {
      userId,
      role: String(payload.role),
      partnerId: payload.partner_id != null ? String(payload.partner_id) : undefined,
      email: payload.email,
      name: payload.name,
      tipeUsaha,
      isVerified,
    },
    bearerToken,
  };
}
