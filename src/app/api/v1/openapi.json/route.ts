import { NextResponse } from 'next/server';
import { openapiSpec } from '@/lib/docs/openapi-spec';

export async function GET() {
  return NextResponse.json(openapiSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
