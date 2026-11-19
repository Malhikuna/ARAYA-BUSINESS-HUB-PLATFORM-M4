import type { AuthUser, Role } from './types';

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
