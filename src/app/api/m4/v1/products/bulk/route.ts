import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { getAuthUser } from '@/lib/auth/guard';
import {
  createProductsBulk,
  ProductValidationError,
  DuplicateSkuError,
} from '@/lib/services/product.service';

export async function POST(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createAuthErrorResponse('INVALID_BODY', 'Payload request body wajib berupa JSON yang valid.', traceId, 400);
    }

    const items = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : null;
    if (!items || items.length === 0) {
      return createAuthErrorResponse('INVALID_ITEMS', 'Daftar item untuk impor massal tidak boleh kosong.', traceId, 400);
    }

    const authUser = getAuthUser(request);
    const createdProducts = await createProductsBulk(items, authUser?.partnerId);

    return createSuccessResponse(
      {
        total_inserted: createdProducts.length,
        items: createdProducts,
      },
      201,
      traceId
    );
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    if (error instanceof DuplicateSkuError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 409, {
        sku: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Gagal melakukan impor massal produk/jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

