import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  ProductNotFoundError,
  ProductValidationError,
  DuplicateSkuError,
  ProductHasTransactionsError,
} from '@/lib/services/product.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    const product = await getProductById(id);
    return createSuccessResponse(product, 200, traceId);
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return createAuthErrorResponse('INVALID_BODY', 'Payload request body wajib berupa JSON yang valid.', traceId, 400);
    }

    const updated = await updateProduct(id, body);
    return createSuccessResponse(updated, 200, traceId);
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof ProductValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    if (error instanceof DuplicateSkuError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 409, {
        sku: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Gagal memperbarui produk/jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    await deleteProduct(id);

    return NextResponse.json(
      {
        success: true,
        data: { id, deleted: true },
        meta: { message: 'Produk/jasa berhasil dihapus.' },
      },
      {
        status: 200,
        headers: { 'X-Request-Id': traceId },
      }
    );
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof ProductHasTransactionsError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 400);
    }

    const message = error instanceof Error ? error.message : 'Gagal menghapus produk/jasa.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
