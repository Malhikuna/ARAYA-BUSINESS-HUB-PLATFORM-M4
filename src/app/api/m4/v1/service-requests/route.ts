import { NextResponse } from 'next/server';
import { createAuthErrorResponse, createSuccessResponse, generateTraceId } from '@/lib/auth/response';
import {
  createServiceRequest,
  getServiceRequests,
  isAdminRole,
  isCustomerRole,
  isPartnerRole,
  resolveRequestCaller,
  resolveVerifiedServicePartner,
  ServiceRequestForbiddenError,
  ServiceRequestValidationError,
} from '@/lib/services/service-request.service';

export async function GET(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const caller = await resolveRequestCaller(request);
    if (caller.invalidToken || (!caller.isServiceCaller && !caller.user)) {
      return createAuthErrorResponse('UNAUTHENTICATED', 'Autentikasi diperlukan.', traceId, 401);
    }

    let scopedPartnerId: string | undefined;
    const { searchParams } = new URL(request.url);

    if (caller.user && isPartnerRole(caller.user.role)) {
      const partner = await resolveVerifiedServicePartner(caller.user);
      scopedPartnerId = partner.partner_id;
    } else if (caller.isServiceCaller || (caller.user && isAdminRole(caller.user.role))) {
      scopedPartnerId = searchParams.get('partner_id') || undefined;
    } else {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Akses ditolak. Daftar permintaan jasa hanya dapat diakses oleh Partner Jasa atau Admin.',
        traceId,
        403
      );
    }

    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = await getServiceRequests({ partner_id: scopedPartnerId, status, search, page, limit });

    return NextResponse.json(
      { success: true, data: result.items, meta: result.meta },
      { status: 200, headers: { 'X-Request-Id': traceId } }
    );
  } catch (error) {
    if (error instanceof ServiceRequestForbiddenError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 403);
    }
    const message = error instanceof Error ? error.message : 'Gagal memuat daftar permintaan jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

export async function POST(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const caller = await resolveRequestCaller(request);
    if (caller.invalidToken || (!caller.isServiceCaller && !caller.user)) {
      return createAuthErrorResponse('UNAUTHENTICATED', 'Autentikasi atau X-Service-Key diperlukan.', traceId, 401);
    }

    const canCreate =
      caller.isServiceCaller ||
      (caller.user !== null && (isAdminRole(caller.user.role) || isCustomerRole(caller.user.role)));

    if (!canCreate) {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Hanya Modul 5 (X-Service-Key), Customer login M1, atau Admin yang dapat mengirim permintaan jasa.',
        traceId,
        403
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createAuthErrorResponse('INVALID_BODY', 'Payload request body wajib berupa JSON yang valid.', traceId, 400);
    }

    const fallbackCustomerUserId =
      caller.user && isCustomerRole(caller.user.role) ? caller.user.userId : undefined;

    const created = await createServiceRequest(body, fallbackCustomerUserId);
    return createSuccessResponse(created, 201, traceId);
  } catch (error) {
    if (error instanceof ServiceRequestValidationError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 400, error.fields);
    }
    if (error instanceof ServiceRequestForbiddenError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 403);
    }
    const message = error instanceof Error ? error.message : 'Gagal menyimpan permintaan jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
