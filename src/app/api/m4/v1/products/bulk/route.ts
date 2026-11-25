import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import { authorizePartnerOrAdmin } from '@/lib/auth/partner-guard';
import {
  createProductsBulk,
  normalizeProductType,
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

    const auth = await authorizePartnerOrAdmin(request, { traceId });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.partnerProfile) {
      const expectedType = auth.partnerProfile.tipe_usaha === 'jasa' ? 'SERVICE' : 'PRODUCT';
      for (const item of items) {
        if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).type === 'string') {
          const normalized = normalizeProductType((item as Record<string, unknown>).type);
          if (['PRODUCT', 'SERVICE', 'ASSET'].includes(normalized) && normalized !== expectedType) {
            return createAuthErrorResponse(
              'FORBIDDEN',
              `Partner ${auth.partnerProfile.tipe_usaha} tidak diizinkan mengimpor item bertipe ${normalized}.`,
              traceId,
              403
            );
          }
        }
      }
    }

    const createdProducts = await createProductsBulk(items, auth.partnerProfile?.partner_id);

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
