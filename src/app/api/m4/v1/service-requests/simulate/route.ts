import { createAuthErrorResponse, createSuccessResponse, generateTraceId } from '@/lib/auth/response';
import {
  createServiceRequest,
  isAdminRole,
  isPartnerRole,
  resolveRequestCaller,
  resolveVerifiedServicePartner,
  SEEDED_CUSTOMER_M1_USER_ID,
  SEEDED_PARTNER_JASA_ID,
  ServiceRequestForbiddenError,
  ServiceRequestValidationError,
} from '@/lib/services/service-request.service';

/**
 * Mock simulator pengiriman form Permintaan Jasa dari Modul 5 (khusus dev/testing).
 */
export async function POST(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  if (process.env.NODE_ENV === 'production') {
    return createAuthErrorResponse(
      'FORBIDDEN',
      'Endpoint simulator M5 dinonaktifkan pada lingkungan produksi.',
      traceId,
      403
    );
  }

  try {
    const caller = await resolveRequestCaller(request);
    if (caller.invalidToken || (!caller.isServiceCaller && !caller.user)) {
      return createAuthErrorResponse('UNAUTHENTICATED', 'Autentikasi diperlukan untuk simulator M5.', traceId, 401);
    }

    let defaultPartnerId = SEEDED_PARTNER_JASA_ID;
    if (caller.user && isPartnerRole(caller.user.role)) {
      const partner = await resolveVerifiedServicePartner(caller.user);
      defaultPartnerId = partner.partner_id;
    } else if (!caller.isServiceCaller && !(caller.user && isAdminRole(caller.user.role))) {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Simulator M5 hanya dapat dijalankan oleh Admin, Partner Jasa, atau panggilan X-Service-Key.',
        traceId,
        403
      );
    }

    const overrides = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const stamp = Date.now();
    const payload = {
      partner_id: defaultPartnerId,
      customer_user_id: SEEDED_CUSTOMER_M1_USER_ID,
      customer_name: 'Dudi Santoso (Simulasi M5)',
      customer_email: 'dudi.santoso@gmail.com',
      customer_phone: '081711223344',
      title: `Permintaan Jasa Simulasi M5 #${stamp}`,
      description: 'Permintaan layanan uji coba yang dikirim melalui mock simulator M5.',
      ...(overrides && typeof overrides === 'object' ? overrides : {}),
    };

    const created = await createServiceRequest(payload);
    return createSuccessResponse(created, 201, traceId);
  } catch (error) {
    if (error instanceof ServiceRequestValidationError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 400, error.fields);
    }
    if (error instanceof ServiceRequestForbiddenError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 403);
    }
    const message = error instanceof Error ? error.message : 'Gagal menjalankan simulator M5.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
