import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/auth/jwt';
import { isPublicPath, getAllowedRolesForPath, isRoleAuthorized } from './lib/auth/rbac';
import { createAuthErrorResponse, generateTraceId } from './lib/auth/response';

const SERVICE_KEY_EXPECTED = process.env.SERVICE_KEY || 'araya-m4-service-key-2026';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Service-Key, X-Request-Id',
};

function applyCorsHeaders(response: NextResponse, traceId: string): NextResponse {
  response.headers.set('x-request-id', traceId);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  // 0. Tangani preflight OPTIONS lintas domain (CORS)
  if (request.method.toUpperCase() === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), traceId);
  }

  // 1. Lewati pengecekan jika rute publik (misal: GET katalog produk, webhook payment gateway, openapi, docs, health)
  if (isPublicPath(pathname, request.method)) {
    return applyCorsHeaders(NextResponse.next(), traceId);
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
      return applyCorsHeaders(response, traceId);
    }

    return applyCorsHeaders(
      createAuthErrorResponse('UNAUTHENTICATED', 'X-Service-Key tidak valid.', traceId, 401),
      traceId
    );
  }

  // 3. Ekstrak header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return applyCorsHeaders(
      createAuthErrorResponse(
        'UNAUTHENTICATED',
        'Token otentikasi tidak ditemukan. Sertakan header Authorization: Bearer <token>.',
        traceId,
        401
      ),
      traceId
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return applyCorsHeaders(
      createAuthErrorResponse('UNAUTHENTICATED', 'Token otentikasi tidak boleh kosong.', traceId, 401),
      traceId
    );
  }

  // 4. Verifikasi token JWT (atau token mock M1 jika tahap pengembangan)
  const verification = await verifyJwt(token);
  if (!verification.valid || !verification.payload) {
    return applyCorsHeaders(
      createAuthErrorResponse(
        'UNAUTHENTICATED',
        verification.error || 'Token otentikasi tidak valid atau telah kedaluwarsa.',
        traceId,
        401
      ),
      traceId
    );
  }

  const { sub, user_id, role, partner_id, unit_usaha_id, email, name } = verification.payload;
  const effectiveUserId = String(user_id ?? sub ?? '');

  // 5. Verifikasi otorisasi peran (RBAC)
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!isRoleAuthorized(role, allowedRoles)) {
    return applyCorsHeaders(
      createAuthErrorResponse(
        'FORBIDDEN',
        `Peran '${role}' tidak memiliki izin untuk mengakses rute '${pathname}'.`,
        traceId,
        403
      ),
      traceId
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

  return applyCorsHeaders(response, traceId);
}

// Kompatibilitas mundur dengan nama 'middleware'
export const middleware = proxy;

export const config = {
  matcher: ['/api/:path*'],
};
