import { NextResponse } from 'next/server';
import { openapiSpec } from '@/lib/docs/openapi-spec';

export async function GET() {
  return NextResponse.json(openapiSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
