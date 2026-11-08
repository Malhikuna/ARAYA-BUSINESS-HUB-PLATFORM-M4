import { NextResponse } from 'next/server';
import { generateSwaggerHtml } from '@/lib/docs/swagger-html';

export async function GET() {
  const html = generateSwaggerHtml();
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
