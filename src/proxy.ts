import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/auth/jwt';
import { isPublicPath, getAllowedRolesForPath, isRoleAuthorized } from './lib/auth/rbac';
import { createAuthErrorResponse, generateTraceId } from './lib/auth/response';

const SERVICE_KEY_EXPECTED = process.env.SERVICE_KEY || 'araya-m4-service-key-2026';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  // 1. Lewati pengecekan jika rute publik (misal: webhook payment gateway, openapi, docs, health)
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', traceId);
    return response;
  }

  // 2. Cek panggilan antarmodul tanpa pengguna via X-Service-Key (Panduan Integrasi Hal. 3)
  const serviceKey = request.headers.get('x-service-key');
  if (serviceKey) {
    if (serviceKey === SERVICE_KEY_EXPECTED || process.env.NODE_ENV !== 'production') {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-caller-type', 'service');
      requestHeaders.set('x-request-id', traceId);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.headers.set('x-request-id', traceId);
      return response;
    }

    return createAuthErrorResponse(
      'UNAUTHENTICATED',
      'X-Service-Key tidak valid.',
      traceId,
      401
    );
  }

  // 3. Ekstrak header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createAuthErrorResponse(
      'UNAUTHENTICATED',
      'Token otentikasi tidak ditemukan. Sertakan header Authorization: Bearer <token>.',
      traceId,
      401
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return createAuthErrorResponse(
      'UNAUTHENTICATED',
      'Token otentikasi tidak boleh kosong.',
      traceId,
      401
    );
  }

  // 4. Verifikasi token JWT (atau token mock M1 jika tahap pengembangan)
  const verification = await verifyJwt(token);
  if (!verification.valid || !verification.payload) {
    return createAuthErrorResponse(
      'UNAUTHENTICATED',
      verification.error || 'Token otentikasi tidak valid atau telah kedaluwarsa.',
      traceId,
      401
    );
  }

  const { sub, user_id, role, partner_id, unit_usaha_id, email, name } = verification.payload;
  const effectiveUserId = String(user_id ?? sub ?? '');

  // 5. Verifikasi otorisasi peran (RBAC)
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!isRoleAuthorized(role, allowedRoles)) {
    return createAuthErrorResponse(
      'FORBIDDEN',
      `Peran '${role}' tidak memiliki izin untuk mengakses rute '${pathname}'.`,
      traceId,
      403
    );
  }

  // 6. Teruskan konteks identitas pengguna melalui header internal
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', effectiveUserId);
  requestHeaders.set('x-user-role', String(role));
  requestHeaders.set('x-request-id', traceId);
  if (name) requestHeaders.set('x-user-name', String(name));
  if (partner_id) requestHeaders.set('x-partner-id', String(partner_id));
  if (unit_usaha_id) requestHeaders.set('x-unit-usaha-id', String(unit_usaha_id));
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
