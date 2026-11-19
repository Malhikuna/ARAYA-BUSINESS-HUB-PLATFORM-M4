import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loginWithM1 } from '@/lib/auth/m1-client';

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid.').max(255),
  password: z.string().min(1, 'Kata sandi wajib diisi.').max(72),
});

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Body JSON tidak valid.',
          fields: null,
        },
      },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data login tidak lengkap atau tidak valid.',
          fields,
        },
      },
      { status: 422 }
    );
  }

  const result = await loginWithM1(parsed.data.email, parsed.data.password);
  return NextResponse.json(result.body, { status: result.status });
}
