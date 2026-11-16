import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { getAuthUser } from '@/lib/auth/guard';
import {
  getProducts,
  createProduct,
  ProductValidationError,
  DuplicateSkuError,
} from '@/lib/services/product.service';

export async function GET(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const is_active = searchParams.get('is_active') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = await getProducts({ search, type, is_active, page, limit });

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
    const product = await createProduct(body, authUser?.partnerId);

    return createSuccessResponse(product, 201, traceId);
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    if (error instanceof DuplicateSkuError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 409, {
        sku: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Gagal menyimpan produk/jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
