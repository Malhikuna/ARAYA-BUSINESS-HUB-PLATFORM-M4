import { NextResponse } from 'next/server';
import { logoutWithM1 } from '@/lib/auth/m1-client';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Token otentikasi tidak ditemukan.',
          fields: null,
        },
      },
      { status: 401 }
    );
  }

  const result = await logoutWithM1(token);
  return NextResponse.json(result.body, { status: result.status });
}
