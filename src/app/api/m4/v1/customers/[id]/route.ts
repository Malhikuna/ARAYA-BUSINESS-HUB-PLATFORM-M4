import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  CustomerNotFoundError,
  CustomerValidationError,
  DuplicateCustomerError,
  CustomerHasTransactionsError,
} from '@/lib/services/customer.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    const customer = await getCustomerById(id);
    return createSuccessResponse(customer, 200, traceId);
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
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

    const updated = await updateCustomer(id, body);
    return createSuccessResponse(updated, 200, traceId);
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof CustomerValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    if (error instanceof DuplicateCustomerError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 409, {
        [error.field]: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Gagal memperbarui data pelanggan.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}

// Kompatibilitas spesifikasi PRD Bab 6.2 (PUT & PATCH)
export const PUT = PATCH;

export async function DELETE(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { id } = await params;
    await deleteCustomer(id);

    return NextResponse.json(
      {
        success: true,
        data: { id, deleted: true },
        meta: { message: 'Pelanggan berhasil dihapus.' },
      },
      {
        status: 200,
        headers: { 'X-Request-Id': traceId },
      }
    );
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 404);
    }

    if (error instanceof CustomerHasTransactionsError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 400);
    }

    const message = error instanceof Error ? error.message : 'Gagal menghapus pelanggan.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
