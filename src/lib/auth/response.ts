import { NextResponse } from 'next/server';
import type { UniformErrorResponse } from './types';

/**
 * Generate trace_id unik berawalan 'req_' untuk pelacakan request
 */
export function generateTraceId(): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `req_${random}`;
}

/**
 * Bangun respon error standar sesuai API Contract Modul 4 v0.1
 */
export function createAuthErrorResponse(
  code: 'UNAUTHORIZED' | 'FORBIDDEN',
  message: string,
  traceId: string,
  status: 401 | 403,
  details: Array<{ field?: string; issue: string }> = []
): NextResponse<UniformErrorResponse> {
  const body: UniformErrorResponse = {
    error: {
      code,
      message,
      details,
      trace_id: traceId,
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
