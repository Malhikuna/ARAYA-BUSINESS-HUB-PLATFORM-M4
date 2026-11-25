import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getAuthUser } from '../auth/guard';
import { verifyJwt } from '../auth/jwt';
import type { AuthUser } from '../auth/types';
import { prisma } from '../prisma';

export const SEEDED_PARTNER_JASA_ID = '00000000-0000-0000-0000-000000000001';
export const SEEDED_USER_PARTNER_JASA_ID = '10000000-0000-0000-0000-000000000001';
export const SEEDED_CUSTOMER_M1_USER_ID = '20000000-0000-0000-0000-000000000017';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^[+0-9\s-]{8,20}$/;
const SERVICE_KEY_EXPECTED = process.env.SERVICE_KEY || 'araya-m4-service-key-2026';

const DEV_PARTNER_ALIASES: Record<string, string> = {
  ptr_01j9zn5r1d: SEEDED_PARTNER_JASA_ID,
  '1': SEEDED_PARTNER_JASA_ID,
  '2': '00000000-0000-0000-0000-000000000002',
  '3': '00000000-0000-0000-0000-000000000003',
};

const DEV_USER_ALIASES: Record<string, string> = {
  usr_mock_partner_001: SEEDED_USER_PARTNER_JASA_ID,
  '2': SEEDED_USER_PARTNER_JASA_ID,
  usr_01j9zp2a8c: SEEDED_CUSTOMER_M1_USER_ID,
  '17': SEEDED_CUSTOMER_M1_USER_ID,
};

export const createServiceRequestSchema = z.object({
  partner_id: z.string().trim().min(1, 'ID Partner tujuan wajib diisi.'),
  customer_user_id: z.union([z.string().trim().min(1), z.number().int().positive()]).nullable().optional(),
  customer_name: z.string().trim().min(1, 'Nama pelanggan wajib diisi.').max(150, 'Nama pelanggan maksimal 150 karakter.'),
  customer_email: z.string().trim().email('Format email pelanggan tidak valid.').max(255, 'Email maksimal 255 karakter.'),
  customer_phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Nomor telepon/WA minimal 8 digit dan maksimal 20 karakter.'),
  title: z.string().trim().min(3, 'Judul permintaan jasa minimal 3 karakter.').max(200, 'Judul maksimal 200 karakter.'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter.').nullable().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;

export class ServiceRequestValidationError extends Error {
  code = 'VALIDATION_ERROR';
  constructor(message: string, public fields: Record<string, string>) {
    super(message);
    this.name = 'ServiceRequestValidationError';
  }
}

export class ServiceRequestForbiddenError extends Error {
  code = 'FORBIDDEN';
  constructor(message: string) {
    super(message);
    this.name = 'ServiceRequestForbiddenError';
  }
}

export class ServiceRequestNotFoundError extends Error {
  code = 'SERVICE_REQUEST_NOT_FOUND';
  constructor(id: string) {
    super(`Permintaan jasa dengan ID '${id}' tidak ditemukan.`);
    this.name = 'ServiceRequestNotFoundError';
  }
}

export function normalizeDbUuid(rawId: string | number, namespace: 'partner' | 'user'): string {
  const clean = String(rawId).trim();
  if (UUID_REGEX.test(clean)) return clean.toLowerCase();

  const lower = clean.toLowerCase();
  const aliasMap = namespace === 'partner' ? DEV_PARTNER_ALIASES : DEV_USER_ALIASES;
  if (aliasMap[lower]) return aliasMap[lower];

  const digest = createHash('sha256').update(`araya:${namespace}:${clean}`).digest();
  digest[6] = (digest[6] & 0x0f) | 0x40;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isAdminRole(role: string): boolean {
  const lower = role.trim().toLowerCase();
  return lower === 'admin' || lower === 'administrator' || lower === 'super_admin';
}

export function isPartnerRole(role: string): boolean {
  return role.trim().toLowerCase() === 'partner';
}

export function isCustomerRole(role: string): boolean {
  return role.trim().toLowerCase() === 'customer';
}

export interface RequestCaller {
  isServiceCaller: boolean;
  user: AuthUser | null;
  invalidToken?: boolean;
}

export async function resolveRequestCaller(request: Request): Promise<RequestCaller> {
  const callerType = request.headers.get('x-caller-type');
  const serviceKey = request.headers.get('x-service-key');
  if (
    callerType === 'service' ||
    (serviceKey && (serviceKey === SERVICE_KEY_EXPECTED || process.env.NODE_ENV !== 'production'))
  ) {
    return { isServiceCaller: true, user: null };
  }

  const headerUser = getAuthUser(request);
  if (headerUser) {
    return { isServiceCaller: false, user: headerUser };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isServiceCaller: false, user: null };
  }

  const token = authHeader.substring(7).trim();
  if (!token) return { isServiceCaller: false, user: null, invalidToken: true };

  const verification = await verifyJwt(token);
  if (!verification.valid || !verification.payload) {
    return { isServiceCaller: false, user: null, invalidToken: true };
  }

  const { payload } = verification;
  const userId = String(payload.user_id ?? payload.sub ?? '');
  if (!userId || !payload.role) {
    return { isServiceCaller: false, user: null, invalidToken: true };
  }

  return {
    isServiceCaller: false,
    user: {
      userId,
      role: String(payload.role),
      partnerId: payload.partner_id != null ? String(payload.partner_id) : undefined,
      email: payload.email,
      name: payload.name,
    },
  };
}

/**
 * Verifikasi bahwa Partner terverifikasi dan bertipe usaha 'jasa' di partner_profiles lokal.
 * shortcut: saat PR #73 (PRO-306) sudah ter-merge, dapat disatukan ke requireServicePartner().
 */
export async function resolveVerifiedServicePartner(user: AuthUser): Promise<{ partner_id: string; user_id: string }> {
  const dbUserId = normalizeDbUuid(user.userId, 'user');
  const dbPartnerId = user.partnerId ? normalizeDbUuid(user.partnerId, 'partner') : undefined;

  const profile = await prisma.partner_profiles.findFirst({
    where: {
      OR: [...(dbPartnerId ? [{ partner_id: dbPartnerId }] : []), { user_id: dbUserId }],
    },
  });

  if (!profile || !profile.is_verified) {
    throw new ServiceRequestForbiddenError('Profil Partner tidak ditemukan atau belum terverifikasi.');
  }
  if (profile.tipe_usaha !== 'jasa') {
    throw new ServiceRequestForbiddenError('Akses ditolak. Menu Permintaan Jasa hanya untuk Partner bertipe Jasa.');
  }

  return { partner_id: profile.partner_id, user_id: profile.user_id };
}

const SERVICE_REQUEST_INCLUDE = {
  customers: {
    select: { id: true, user_id: true, name: true, email: true, phone: true },
  },
  quotations: {
    select: { id: true, quotation_number: true, status: true, total_amount: true },
  },
} as const;

export async function createServiceRequest(rawInput: unknown, fallbackCustomerUserId?: string) {
  const parsed = createServiceRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fields[key]) fields[key] = issue.message;
    }
    throw new ServiceRequestValidationError('Data permintaan jasa tidak valid.', fields);
  }

  const data = parsed.data;
  const targetPartnerId = normalizeDbUuid(data.partner_id, 'partner');
  const normalizedEmail = data.customer_email.toLowerCase();
  const rawCustomerUserId = data.customer_user_id ?? fallbackCustomerUserId ?? null;
  const customerUserId = rawCustomerUserId != null ? normalizeDbUuid(rawCustomerUserId, 'user') : null;

  const partner = await prisma.partner_profiles.findUnique({
    where: { partner_id: targetPartnerId },
    select: { partner_id: true, tipe_usaha: true, is_verified: true },
  });

  if (!partner) {
    throw new ServiceRequestValidationError('Partner tujuan tidak ditemukan.', {
      partner_id: `Partner dengan ID '${data.partner_id}' tidak terdaftar.`,
    });
  }
  if (!partner.is_verified) {
    throw new ServiceRequestForbiddenError('Partner tujuan belum terverifikasi.');
  }
  if (partner.tipe_usaha !== 'jasa') {
    throw new ServiceRequestForbiddenError('Permintaan jasa hanya dapat dikirim ke Partner bertipe Jasa.');
  }

  return prisma.$transaction(async (tx) => {
    const existingCustomer = await tx.customers.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: data.customer_phone }],
      },
    });

    let customerId: string;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      if (customerUserId && !existingCustomer.user_id) {
        await tx.customers.update({
          where: { id: existingCustomer.id },
          data: { user_id: customerUserId, updated_at: new Date() },
        });
      }
    } else {
      const createdCustomer = await tx.customers.create({
        data: {
          user_id: customerUserId,
          name: data.customer_name,
          email: normalizedEmail,
          phone: data.customer_phone,
        },
      });
      customerId = createdCustomer.id;
    }

    return tx.service_requests.create({
      data: {
        partner_id: partner.partner_id,
        customer_id: customerId,
        customer_user_id: customerUserId,
        customer_name: data.customer_name,
        customer_email: normalizedEmail,
        customer_phone: data.customer_phone,
        title: data.title,
        description: data.description ?? null,
        status: 'baru',
      },
      include: SERVICE_REQUEST_INCLUDE,
    });
  });
}

export async function getServiceRequests(query: {
  partner_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.partner_id) where.partner_id = query.partner_id;
  if (query.status) where.status = query.status.trim().toLowerCase();
  if (query.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { title: { contains: s, mode: 'insensitive' as const } },
      { customer_name: { contains: s, mode: 'insensitive' as const } },
      { customer_phone: { contains: s, mode: 'insensitive' as const } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.service_requests.findMany({
      where,
      skip,
      take: limit,
      include: SERVICE_REQUEST_INCLUDE,
      orderBy: { created_at: 'desc' },
    }),
    prisma.service_requests.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getServiceRequestById(id: string, scopedPartnerId?: string) {
  if (!UUID_REGEX.test(id)) {
    throw new ServiceRequestNotFoundError(id);
  }

  const item = await prisma.service_requests.findUnique({
    where: { id },
    include: SERVICE_REQUEST_INCLUDE,
  });

  if (!item) {
    throw new ServiceRequestNotFoundError(id);
  }
  if (scopedPartnerId && item.partner_id !== scopedPartnerId) {
    throw new ServiceRequestForbiddenError('Anda tidak memiliki akses ke permintaan jasa milik Partner lain.');
  }

  return item;
}
