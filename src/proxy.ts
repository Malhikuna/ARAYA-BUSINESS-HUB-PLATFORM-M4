import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/auth/jwt';
import { isPublicPath, getAllowedRolesForPath, isRoleAuthorized } from './lib/auth/rbac';
import { createAuthErrorResponse, generateTraceId } from './lib/auth/response';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  // 1. Lewati pengecekan jika rute publik (misal: webhook payment gateway atau health check)
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', traceId);
    return response;
  }

  // 2. Ekstrak header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createAuthErrorResponse(
      'UNAUTHORIZED',
      'Token otentikasi tidak ditemukan. Sertakan header Authorization: Bearer <token>.',
      traceId,
      401
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return createAuthErrorResponse(
      'UNAUTHORIZED',
      'Token otentikasi tidak boleh kosong.',
      traceId,
      401
    );
  }

  // 3. Verifikasi token JWT (atau token mock M1 jika tahap pengembangan)
  const verification = await verifyJwt(token);
  if (!verification.valid || !verification.payload) {
    return createAuthErrorResponse(
      'UNAUTHORIZED',
      verification.error || 'Token otentikasi tidak valid atau telah kedaluwarsa.',
      traceId,
      401
    );
  }

  const { sub, role, partner_id, email } = verification.payload;

  // 4. Verifikasi otorisasi peran (RBAC)
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!isRoleAuthorized(role, allowedRoles)) {
    return createAuthErrorResponse(
      'FORBIDDEN',
      `Peran '${role}' tidak memiliki izin untuk mengakses rute '${pathname}'.`,
      traceId,
      403
    );
  }

  // 5. Teruskan konteks identitas pengguna melalui header internal
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', sub);
  requestHeaders.set('x-user-role', role);
  requestHeaders.set('x-request-id', traceId);
  if (partner_id) requestHeaders.set('x-partner-id', partner_id);
  if (email) requestHeaders.set('x-user-email', email);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-request-id', traceId);
  return response;
}

// Kompatibilitas mundur dengan nama 'middleware'
export const middleware = proxy;

export const config = {
  matcher: ['/api/:path*'],
};
