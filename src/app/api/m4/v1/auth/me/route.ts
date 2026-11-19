import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guard';

export async function GET(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Pengguna tidak terotentikasi.',
          fields: null,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user_id: user.userId,
      name: user.name ?? null,
      role: user.role,
      division: user.division ?? null,
      partner_id: user.partnerId ?? null,
      unit_usaha_id: user.unitUsahaId ?? null,
      is_super_admin: Boolean(user.isSuperAdmin),
      email: user.email ?? null,
      permissions: user.permissions ?? [],
    },
  });
}
