import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { requireServicePartner } from '@/lib/auth/partner-guard';
import { resolveDbUuid } from '@/lib/services/partner-profile.service';
import { getQuotationById, QuotationNotFoundError } from '@/lib/services/quotation.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const auth = await requireServicePartner(request, { traceId, allowCustomer: true, requireAuth: true });
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const quotation = await getQuotationById(id);

    if (auth.partnerProfile && quotation.partner_id !== auth.partnerProfile.partner_id) {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Anda tidak memiliki akses ke penawaran partner lain.',
        traceId,
        403
      );
    }

    if (auth.isCustomer && auth.authUser) {
      const actorUuid = resolveDbUuid(auth.authUser.userId, 'user');
      const ownerUuid = quotation.customers?.user_id
        ? resolveDbUuid(quotation.customers.user_id, 'user')
        : null;
      if (!ownerUuid || ownerUuid !== actorUuid) {
        return createAuthErrorResponse(
          'QUOTATION_NOT_FOUND',
          `Penawaran dengan ID '${id}' tidak ditemukan.`,
          traceId,
          404
        );
      }
    }

    return createSuccessResponse(quotation, 200, traceId);
  } catch (error) {
    if (error instanceof QuotationNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
