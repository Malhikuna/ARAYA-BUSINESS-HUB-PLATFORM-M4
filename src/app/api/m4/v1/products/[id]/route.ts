import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { resolveRequestAuthUser } from '@/lib/auth/guard';
import { authorizePartnerOrAdmin, isPartnerRole } from '@/lib/auth/partner-guard';
import {
  PartnerForbiddenError,
  resolveAndVerifyPartnerProfile,
} from '@/lib/services/partner-profile.service';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  normalizeProductType,
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
    const { user, bearerToken } = await resolveRequestAuthUser(request);

    let expectedType: string | null = null;
    if (user && isPartnerRole(user.role)) {
      const profile = await resolveAndVerifyPartnerProfile(user, { bearerToken });
      expectedType = profile.tipe_usaha === 'jasa' ? 'SERVICE' : 'PRODUCT';
    }

    const product = await getProductById(id);
    if (expectedType && product.type !== expectedType) {
      return createAuthErrorResponse('FORBIDDEN', 'Akses item lintas tipe usaha tidak diizinkan.', traceId, 403);
    }

    return createSuccessResponse(product, 200, traceId);
  } catch (error) {
    if (error instanceof PartnerForbiddenError) {
      return createAuthErrorResponse('FORBIDDEN', error.message, traceId, 403);
    }
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

    const auth = await authorizePartnerOrAdmin(request, { traceId });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.partnerProfile) {
      const existing = await getProductById(id);
      if (existing.partner_id !== auth.partnerProfile.partner_id) {
        return createAuthErrorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke produk/jasa partner lain.', traceId, 403);
      }

      const expectedType = auth.partnerProfile.tipe_usaha === 'jasa' ? 'SERVICE' : 'PRODUCT';
      const rawType = (body as Record<string, unknown>).type;
      if (typeof rawType === 'string' && rawType.trim()) {
        const normalized = normalizeProductType(rawType);
        if (['PRODUCT', 'SERVICE', 'ASSET'].includes(normalized) && normalized !== expectedType) {
          return createAuthErrorResponse(
            'FORBIDDEN',
            `Partner ${auth.partnerProfile.tipe_usaha} tidak diizinkan mengubah tipe item menjadi ${normalized}.`,
            traceId,
            403
          );
        }
      }
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

// Kompatibilitas spesifikasi PRD Bab 6.2 (PUT & PATCH)
export const PUT = PATCH;

export async function DELETE(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    const auth = await authorizePartnerOrAdmin(request, { traceId });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.partnerProfile) {
      const existing = await getProductById(id);
      if (existing.partner_id !== auth.partnerProfile.partner_id) {
        return createAuthErrorResponse('FORBIDDEN', 'Anda tidak memiliki akses menghapus produk/jasa partner lain.', traceId, 403);
      }
    }

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
