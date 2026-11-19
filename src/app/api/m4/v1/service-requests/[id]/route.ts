import { createAuthErrorResponse, createSuccessResponse, generateTraceId } from '@/lib/auth/response';
import {
  getServiceRequestById,
  isAdminRole,
  isPartnerRole,
  resolveRequestCaller,
  resolveVerifiedServicePartner,
  ServiceRequestForbiddenError,
  ServiceRequestNotFoundError,
} from '@/lib/services/service-request.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const caller = await resolveRequestCaller(request);
    if (caller.invalidToken || (!caller.isServiceCaller && !caller.user)) {
      return createAuthErrorResponse('UNAUTHENTICATED', 'Autentikasi diperlukan.', traceId, 401);
    }

    let scopedPartnerId: string | undefined;
    if (caller.user && isPartnerRole(caller.user.role)) {
      const partner = await resolveVerifiedServicePartner(caller.user);
      scopedPartnerId = partner.partner_id;
    } else if (!caller.isServiceCaller && !(caller.user && isAdminRole(caller.user.role))) {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Akses ditolak. Detail permintaan jasa hanya dapat diakses oleh Partner Jasa atau Admin.',
        traceId,
        403
      );
    }

    const { id } = await params;
    const item = await getServiceRequestById(id, scopedPartnerId);
    return createSuccessResponse(item, 200, traceId);
  } catch (error) {
    if (error instanceof ServiceRequestNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }
    if (error instanceof ServiceRequestForbiddenError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 403);
    }
    const message = error instanceof Error ? error.message : 'Gagal memuat detail permintaan jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
