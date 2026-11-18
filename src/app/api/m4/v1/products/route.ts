import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { resolveRequestAuthUser } from '@/lib/auth/guard';
import { authorizePartnerOrAdmin, isPartnerRole } from '@/lib/auth/partner-guard';
import {
  PartnerForbiddenError,
  resolveAndVerifyPartnerProfile,
} from '@/lib/services/partner-profile.service';
import {
  getProducts,
  createProduct,
  normalizeProductType,
  ProductValidationError,
  DuplicateSkuError,
} from '@/lib/services/product.service';

export async function GET(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const rawType = searchParams.get('type') || undefined;
    const is_active = searchParams.get('is_active') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    let effectiveType = rawType;
    const { user, bearerToken } = await resolveRequestAuthUser(request);

    if (user && isPartnerRole(user.role)) {
      const profile = await resolveAndVerifyPartnerProfile(user, { bearerToken });
      const allowedType = profile.tipe_usaha === 'jasa' ? 'SERVICE' : 'PRODUCT';

      if (rawType && normalizeProductType(rawType) !== allowedType) {
        const safePage = Math.max(1, page || 1);
        const safeLimit = Math.min(100, Math.max(1, limit || 10));
        return NextResponse.json(
          {
            success: true,
            data: [],
            meta: { page: safePage, limit: safeLimit, total: 0, totalPages: 1 },
          },
          { status: 200, headers: { 'X-Request-Id': traceId } }
        );
      }
      effectiveType = allowedType;
    }

    const result = await getProducts({ search, type: effectiveType, is_active, page, limit });

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
    if (error instanceof PartnerForbiddenError) {
      return createAuthErrorResponse('FORBIDDEN', error.message, traceId, 403);
    }
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

    const auth = await authorizePartnerOrAdmin(request, { traceId });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.partnerProfile) {
      const expectedType = auth.partnerProfile.tipe_usaha === 'jasa' ? 'SERVICE' : 'PRODUCT';
      const rawType = (body as Record<string, unknown>).type;
      if (typeof rawType === 'string' && rawType.trim()) {
        const normalized = normalizeProductType(rawType);
        if (['PRODUCT', 'SERVICE', 'ASSET'].includes(normalized) && normalized !== expectedType) {
          return createAuthErrorResponse(
            'FORBIDDEN',
            `Partner ${auth.partnerProfile.tipe_usaha} tidak diizinkan membuat item bertipe ${normalized}.`,
            traceId,
            403
          );
        }
      }
    }

    const product = await createProduct(body, auth.partnerProfile?.partner_id);
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
