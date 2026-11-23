import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { requireServicePartner } from '@/lib/auth/partner-guard';
import {
  getQuotationById,
  updateQuotationStatus,
  updateQuotationStatusSchema,
  QuotationForbiddenError,
  QuotationNotFoundError,
  InvalidQuotationStatusError,
} from '@/lib/services/quotation.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return createAuthErrorResponse('INVALID_BODY', 'Payload request body wajib berupa JSON yang valid.', traceId, 400);
    }

    const auth = await requireServicePartner(request, { traceId, requireAuth: true });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.partnerProfile) {
      const existing = await getQuotationById(id);
      if (existing.partner_id !== auth.partnerProfile.partner_id) {
        return createAuthErrorResponse(
          'FORBIDDEN',
          'Anda tidak memiliki akses mengubah status penawaran partner lain.',
          traceId,
          403
        );
      }
    }

    const parsed = updateQuotationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return createAuthErrorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Status tidak valid.', traceId, 400);
    }

    const updated = await updateQuotationStatus(id, parsed.data.status, { isAdmin: auth.isAdmin });
    return createSuccessResponse(updated, 200, traceId);
  } catch (error) {
    if (error instanceof QuotationNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof QuotationForbiddenError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 403);
    }

    if (error instanceof InvalidQuotationStatusError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 422);
    }

    const message = error instanceof Error ? error.message : 'Gagal memperbarui status penawaran.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
