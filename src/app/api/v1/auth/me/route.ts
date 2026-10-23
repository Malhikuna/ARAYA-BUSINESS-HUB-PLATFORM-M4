import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guard';

export async function GET(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Pengguna tidak terotentikasi.',
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: {
      user_id: user.userId,
      role: user.role,
      partner_id: user.partnerId ?? null,
      email: user.email ?? null,
    },
  });
}
