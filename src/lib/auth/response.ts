import { NextResponse } from 'next/server';
import type { UniformErrorResponse, UniformSuccessResponse, PaginationMeta } from './types';

/**
 * Generate trace_id unik berawalan 'req_' untuk pelacakan request
 */
export function generateTraceId(): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `req_${random}`;
}

/**
 * Bangun respon error seragam sesuai Panduan API Bersama (Hal. 4 & 10)
 * Amplop: { success: false, error: { code, message, fields } }
 */
export function createAuthErrorResponse(
  code: string,
  message: string,
  traceId: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400,
  fields: Record<string, string> | null = null
): NextResponse<UniformErrorResponse> {
  const body: UniformErrorResponse = {
    success: false,
    error: {
      code,
      message,
      fields: fields ?? null,
    },
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': traceId,
    },
  });
}

/**
 * Bangun respon sukses satu data sesuai Panduan API Bersama (Hal. 3)
 * Amplop: { success: true, data: { ... } }
 */
export function createSuccessResponse<T>(
  data: T,
  status: 200 | 201 = 200,
  traceId?: string
): NextResponse<UniformSuccessResponse<T>> {
  const body: UniformSuccessResponse<T> = {
    success: true,
    data,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (traceId) {
    headers['X-Request-Id'] = traceId;
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Bangun respon sukses daftar data dengan meta pagination sesuai Panduan API Bersama (Hal. 3)
 * Amplop: { success: true, data: [ ... ], meta: { page, per_page, total, total_pages } }
 */
export function createPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  status: 200 = 200,
  traceId?: string
): NextResponse<UniformSuccessResponse<T[]>> {
  const body: UniformSuccessResponse<T[]> = {
    success: true,
    data,
    meta,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (traceId) {
    headers['X-Request-Id'] = traceId;
  }

  return NextResponse.json(body, { status, headers });
}
