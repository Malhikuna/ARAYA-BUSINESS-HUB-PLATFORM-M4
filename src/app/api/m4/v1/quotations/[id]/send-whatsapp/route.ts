import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { requireServicePartner } from '@/lib/auth/partner-guard';
import {
  InvalidQuotationStatusError,
  QuotationForbiddenError,
  QuotationNotFoundError,
} from '@/lib/services/quotation.schema';
import { sendQuotationViaWhatsApp } from '@/lib/services/quotation-workflow';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const auth = await requireServicePartner(request, { traceId, requireAuth: true });
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const result = await sendQuotationViaWhatsApp(id, auth.partnerProfile?.partner_id);
    return createSuccessResponse(result, 200, traceId);
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

    const message = error instanceof Error ? error.message : 'Gagal mengirim penawaran ke WhatsApp.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
