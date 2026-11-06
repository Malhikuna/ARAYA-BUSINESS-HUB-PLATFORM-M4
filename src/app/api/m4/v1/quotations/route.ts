import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { getAuthUser } from '@/lib/auth/guard';
import {
  getQuotations,
  createQuotation,
  QuotationValidationError,
  EmptyQuotationItemsError,
} from '@/lib/services/quotation.service';

export async function GET(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const customer_id = searchParams.get('customer_id') || undefined;
    const partner_id = searchParams.get('partner_id') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = await getQuotations({ search, status, customer_id, partner_id, page, limit });

    return NextResponse.json(
      {
        success: true,
        data: result.items,
        meta: result.meta,
      },
      {
        status: 200,
        headers: { 'X-Request-Id': traceId },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

export async function POST(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createAuthErrorResponse('INVALID_BODY', 'Payload request body wajib berupa JSON yang valid.', traceId, 400);
    }

    const authUser = getAuthUser(request);
    const quotation = await createQuotation(body, authUser?.partnerId);

    return createSuccessResponse(quotation, 201, traceId);
  } catch (error) {
    if (error instanceof EmptyQuotationItemsError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 422, {
        items: error.message,
      });
    }

    if (error instanceof QuotationValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    const message = error instanceof Error ? error.message : 'Gagal membuat penawaran baru.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
