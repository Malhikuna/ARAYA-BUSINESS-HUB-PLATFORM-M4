import { createHash } from 'node:crypto';
import type { AuthUser } from '../auth/types';
import {
  fetchPartnerFromM3,
  type PartnerBusinessType,
} from '../integrations/m3-partner.client';
import { prisma } from '../prisma';

export const SEEDED_PARTNER_JASA_ID = '00000000-0000-0000-0000-000000000001';
export const SEEDED_PARTNER_PRODUK_ID = '00000000-0000-0000-0000-000000000002';
export const SEEDED_PARTNER_UNVERIFIED_ID = '00000000-0000-0000-0000-000000000003';
export const SEEDED_USER_PARTNER_JASA_ID = '10000000-0000-0000-0000-000000000001';
export const SEEDED_CUSTOMER_M1_USER_ID = '20000000-0000-0000-0000-000000000017';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PARTNER_DEV_ALIASES: Record<string, string> = {
  ptr_01j9zn5r1d: SEEDED_PARTNER_JASA_ID,
  '1': SEEDED_PARTNER_JASA_ID,
  '2': SEEDED_PARTNER_PRODUK_ID,
  '3': SEEDED_PARTNER_UNVERIFIED_ID,
};

const USER_DEV_ALIASES: Record<string, string> = {
  usr_mock_partner_001: SEEDED_USER_PARTNER_JASA_ID,
  '2': SEEDED_USER_PARTNER_JASA_ID,
  usr_01j9zp2a8c: SEEDED_CUSTOMER_M1_USER_ID,
  '17': SEEDED_CUSTOMER_M1_USER_ID,
};

export class PartnerForbiddenError extends Error {
  code = 'FORBIDDEN';
  status = 403;

  constructor(message: string) {
    super(message);
    this.name = 'PartnerForbiddenError';
  }
}

export interface EnsurePartnerProfileInput {
  partner_id: string;
  user_id: string;
  tipe_usaha: PartnerBusinessType;
  is_verified: boolean;
}

export interface ResolvedPartnerProfile {
  partner_id: string;
  user_id: string;
  tipe_usaha: PartnerBusinessType;
  is_verified: boolean;
  source: 'm3' | 'local_db' | 'dev_mock' | 'm1_claims';
}

export interface ResolvePartnerOptions {
  bearerToken?: string;
  m3ApiUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Normalisasi ID (UUID valid, alias dev/seed mock token, atau ID non-UUID M1/M3)
 * menjadi UUID RFC-4122 deterministik yang aman untuk kolom @db.Uuid PostgreSQL.
 */
export function resolveDbUuid(rawId: string | number, namespace: 'partner' | 'user'): string {
  const normalized = String(rawId).trim();
  if (UUID_REGEX.test(normalized)) {
    return normalized.toLowerCase();
  }

  const lower = normalized.toLowerCase();
  const aliasMap = namespace === 'partner' ? PARTNER_DEV_ALIASES : USER_DEV_ALIASES;
  if (aliasMap[lower]) {
    return aliasMap[lower];
  }

  const digest = createHash('sha256').update(`araya:${namespace}:${normalized}`).digest();
  digest[6] = (digest[6] & 0x0f) | 0x40;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Sinkronkan Partner terverifikasi ke tabel lokal partner_profiles
 * untuk mencegah error foreign key P2003 dan bentrok unique user_id P2002.
 */
export async function ensurePartnerProfile(input: EnsurePartnerProfileInput) {
  if (!input.is_verified) {
    throw new PartnerForbiddenError('Akun Partner belum terverifikasi.');
  }

  const partnerId = resolveDbUuid(input.partner_id, 'partner');
  const userId = resolveDbUuid(input.user_id, 'user');

  const [byPartner, byUser] = await Promise.all([
    prisma.partner_profiles.findUnique({ where: { partner_id: partnerId } }),
    prisma.partner_profiles.findUnique({ where: { user_id: userId } }),
  ]);

  if (byPartner) {
    const canSyncUserId = !byUser || byUser.partner_id === partnerId;
    return prisma.partner_profiles.update({
      where: { partner_id: partnerId },
      data: {
        ...(canSyncUserId ? { user_id: userId } : {}),
        tipe_usaha: input.tipe_usaha,
        is_verified: true,
        updated_at: new Date(),
      },
    });
  }

  if (byUser) {
    return prisma.partner_profiles.update({
      where: { user_id: userId },
      data: {
        partner_id: partnerId,
        tipe_usaha: input.tipe_usaha,
        is_verified: true,
        updated_at: new Date(),
      },
    });
  }

  return prisma.partner_profiles.create({
    data: {
      partner_id: partnerId,
      user_id: userId,
      tipe_usaha: input.tipe_usaha,
      is_verified: true,
    },
  });
}

async function revokePartnerVerificationInDb(
  rawPartnerIds: Array<string | undefined>,
  rawUserIds: Array<string | undefined>
): Promise<void> {
  const partnerUuids = Array.from(
    new Set(
      rawPartnerIds
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => resolveDbUuid(v, 'partner'))
    )
  );
  const userUuids = Array.from(
    new Set(
      rawUserIds
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => resolveDbUuid(v, 'user'))
    )
  );

  const filters = [
    ...(partnerUuids.length > 0 ? [{ partner_id: { in: partnerUuids } }] : []),
    ...(userUuids.length > 0 ? [{ user_id: { in: userUuids } }] : []),
  ];
  if (filters.length === 0) return;

  await prisma.partner_profiles.updateMany({
    where: { OR: filters, is_verified: true },
    data: { is_verified: false, updated_at: new Date() },
  });
}

function isDevMockPartner(authUser: AuthUser): boolean {
  return authUser.partnerId === 'ptr_01J9ZN5R1D' || authUser.userId === 'usr_mock_partner_001';
}

/**
 * Resolusi profil Partner secara berjenjang:
 * 1. API Modul 3 (bila terkonfigurasi & merespon) + auto-upsert partner_profiles
 * 2. Fallback tabel lokal partner_profiles (T-39)
 * 3. Fallback mock dev terverifikasi / klaim dev eksplisit (selain itu fail-closed 403)
 */
export async function resolveAndVerifyPartnerProfile(
  authUser: AuthUser,
  options: ResolvePartnerOptions = {}
): Promise<ResolvedPartnerProfile> {
  const dbUserId = resolveDbUuid(authUser.userId, 'user');
  const dbPartnerId = authUser.partnerId ? resolveDbUuid(authUser.partnerId, 'partner') : undefined;

  const m3Record = await fetchPartnerFromM3({
    partnerId: authUser.partnerId,
    userId: authUser.userId,
    normalizedPartnerId: dbPartnerId,
    normalizedUserId: dbUserId,
    bearerToken: options.bearerToken,
    m3ApiUrl: options.m3ApiUrl,
    timeoutMs: options.timeoutMs,
    fetchImpl: options.fetchImpl,
  });

  if (m3Record) {
    if (!m3Record.is_verified) {
      await revokePartnerVerificationInDb(
        [m3Record.partner_id, m3Record.numeric_id, authUser.partnerId],
        [m3Record.user_id, authUser.userId]
      );
      const reason =
        m3Record.status === 'ditangguhkan'
          ? 'Akun Partner sedang ditangguhkan di Modul 3.'
          : 'Akun Partner belum terverifikasi di Modul 3.';
      throw new PartnerForbiddenError(reason);
    }
    const resolvedPartnerId = resolveDbUuid(m3Record.partner_id, 'partner');
    const resolvedUserId = m3Record.user_id ? resolveDbUuid(m3Record.user_id, 'user') : dbUserId;
    const saved = await ensurePartnerProfile({
      partner_id: resolvedPartnerId,
      user_id: resolvedUserId,
      tipe_usaha: m3Record.tipe_usaha,
      is_verified: true,
    });
    return {
      partner_id: saved.partner_id,
      user_id: saved.user_id,
      tipe_usaha: saved.tipe_usaha as PartnerBusinessType,
      is_verified: saved.is_verified,
      source: 'm3',
    };
  }

  const localProfile = await prisma.partner_profiles.findFirst({
    where: {
      OR: [
        ...(dbPartnerId ? [{ partner_id: dbPartnerId }] : []),
        { user_id: dbUserId },
      ],
    },
  });

  if (localProfile) {
    if (!localProfile.is_verified) {
      throw new PartnerForbiddenError('Akun Partner belum terverifikasi.');
    }
    return {
      partner_id: localProfile.partner_id,
      user_id: localProfile.user_id,
      tipe_usaha: localProfile.tipe_usaha as PartnerBusinessType,
      is_verified: localProfile.is_verified,
      source: 'local_db',
    };
  }

  if (isDevMockPartner(authUser)) {
    const saved = await ensurePartnerProfile({
      partner_id: SEEDED_PARTNER_JASA_ID,
      user_id: SEEDED_USER_PARTNER_JASA_ID,
      tipe_usaha: 'jasa',
      is_verified: true,
    });
    return {
      partner_id: saved.partner_id,
      user_id: saved.user_id,
      tipe_usaha: 'jasa',
      is_verified: true,
      source: 'dev_mock',
    };
  }

  if (
    authUser.isVerified === true &&
    authUser.partnerId &&
    (authUser.tipeUsaha === 'produk' || authUser.tipeUsaha === 'jasa')
  ) {
    const saved = await ensurePartnerProfile({
      partner_id: authUser.partnerId,
      user_id: authUser.userId,
      tipe_usaha: authUser.tipeUsaha,
      is_verified: true,
    });
    return {
      partner_id: saved.partner_id,
      user_id: saved.user_id,
      tipe_usaha: saved.tipe_usaha as PartnerBusinessType,
      is_verified: true,
      source: 'm1_claims',
    };
  }

  throw new PartnerForbiddenError('Profil Partner tidak ditemukan atau belum terverifikasi.');
}

/**
 * Pastikan partner_id target ada di partner_profiles sebelum write DB (mencegah P2003).
 */
export async function partnerExistsInDb(partnerId: string): Promise<boolean> {
  if (!UUID_REGEX.test(partnerId)) return false;
  const profile = await prisma.partner_profiles.findUnique({
    where: { partner_id: partnerId.toLowerCase() },
    select: { partner_id: true },
  });
  return Boolean(profile);
}
