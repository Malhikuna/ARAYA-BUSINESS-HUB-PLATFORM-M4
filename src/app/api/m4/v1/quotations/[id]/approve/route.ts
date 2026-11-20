import { resolveRequestAuthUser } from '@/lib/auth/guard';
import { isAdminRole, isCustomerRole } from '@/lib/auth/partner-guard';
import { createAuthErrorResponse, createSuccessResponse, generateTraceId } from '@/lib/auth/response';
import {
  InvalidQuotationStatusError,
  QuotationForbiddenError,
  QuotationNotFoundError,
} from '@/lib/services/quotation.schema';
import { approveQuotationByCustomer } from '@/lib/services/quotation-workflow';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { user, invalidToken } = await resolveRequestAuthUser(request);
    if (invalidToken || !user) {
      return createAuthErrorResponse(
        'UNAUTHENTICATED',
        'Autentikasi Customer M1 diperlukan untuk menyetujui penawaran.',
        traceId,
        401
      );
    }

    const isAdmin = isAdminRole(user.role);
    if (!isAdmin && !isCustomerRole(user.role)) {
      return createAuthErrorResponse(
        'FORBIDDEN',
        'Hanya Customer pemilik penawaran atau Administrator yang dapat menyetujui penawaran.',
        traceId,
        403
      );
    }

    const { id } = await params;
    const approved = await approveQuotationByCustomer(id, { userId: user.userId, isAdmin });
    return createSuccessResponse(approved, 200, traceId);
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

    const message = error instanceof Error ? error.message : 'Gagal menyetujui penawaran.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
