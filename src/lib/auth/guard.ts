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
  const email = request.headers.get('x-user-email') || undefined;

  return {
    userId,
    role,
    partnerId,
    email,
  };
}
