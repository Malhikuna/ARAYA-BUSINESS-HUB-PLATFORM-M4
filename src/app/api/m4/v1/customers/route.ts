import { NextResponse } from 'next/server';
import { generateTraceId, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth/response';
import {
  getCustomers,
  createCustomer,
  CustomerValidationError,
  DuplicateCustomerError,
} from '@/lib/services/customer.service';

export async function GET(request: Request) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = await getCustomers({ search, page, limit });

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
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
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

    const customer = await createCustomer({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
    });

    return createSuccessResponse(customer, 201, traceId);
  } catch (error) {
    if (error instanceof CustomerValidationError) {
      return createAuthErrorResponse('VALIDATION_ERROR', error.message, traceId, 400, error.fields);
    }

    if (error instanceof DuplicateCustomerError) {
      return createAuthErrorResponse(error.code, error.message, traceId, 409, {
        [error.field]: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Gagal menyimpan data pelanggan.';
    return createAuthErrorResponse('INTERNAL_SERVER_ERROR', message, traceId, 500);
  }
}
