import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import {
  updateQuotationStatus,
  updateQuotationStatusSchema,
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

    const parsed = updateQuotationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return createAuthErrorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Status tidak valid.', traceId, 400);
    }

    const updated = await updateQuotationStatus(id, parsed.data.status);
    return createSuccessResponse(updated, 200, traceId);
  } catch (error) {
    if (error instanceof QuotationNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof InvalidQuotationStatusError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 422);
    }

    const message = error instanceof Error ? error.message : 'Gagal memperbarui status penawaran.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
