export type PartnerBusinessType = 'produk' | 'jasa';

export interface M3PartnerRecord {
  partner_id: string;
  user_id?: string;
  tipe_usaha: PartnerBusinessType;
  is_verified: boolean;
}

export interface FetchM3PartnerOptions {
  partnerId?: string;
  userId?: string;
  normalizedPartnerId?: string;
  normalizedUserId?: string;
  bearerToken?: string;
  m3ApiUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const VERIFIED_STATUSES = new Set(['terverifikasi', 'verified', 'approved', 'active', 'aktif']);

export function normalizePartnerBusinessType(raw: unknown): PartnerBusinessType | null {
  if (typeof raw !== 'string') return null;
  const val = raw.trim().toLowerCase();
  if (val === 'jasa' || val === 'service' || val === 'services') return 'jasa';
  if (val === 'produk' || val === 'product' || val === 'products' || val === 'barang') return 'produk';
  return null;
}

function normalizeIsVerified(item: Record<string, unknown>): boolean {
  if (typeof item.is_verified === 'boolean') return item.is_verified;
  if (typeof item.verified === 'boolean') return item.verified;
  if (typeof item.status === 'string') {
    return VERIFIED_STATUSES.has(item.status.trim().toLowerCase());
  }
  return false;
}

function buildM3PartnersUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/partners')) return clean;
  if (clean.endsWith('/api/m3/v1')) return `${clean}/partners`;
  return `${clean}/api/m3/v1/partners`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractPartnerCandidates(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.data)) return payload.data.filter(isRecord);
  if (isRecord(payload.data)) {
    if (Array.isArray(payload.data.partners)) return payload.data.partners.filter(isRecord);
    if (Array.isArray(payload.data.items)) return payload.data.items.filter(isRecord);
    return [payload.data];
  }
  if (Array.isArray(payload.partners)) return payload.partners.filter(isRecord);
  if ('partner_id' in payload || 'user_id' in payload || 'tipe_usaha' in payload) {
    return [payload];
  }
  return [];
}

function parsePartnerRecord(item: Record<string, unknown>): M3PartnerRecord | null {
  const rawPartnerId = item.partner_id ?? item.id;
  if (rawPartnerId === undefined || rawPartnerId === null || String(rawPartnerId).trim() === '') {
    return null;
  }

  const tipeUsaha = normalizePartnerBusinessType(item.tipe_usaha ?? item.business_type ?? item.type);
  if (!tipeUsaha) return null;

  const rawUserId = item.user_id;
  return {
    partner_id: String(rawPartnerId).trim(),
    user_id: rawUserId !== undefined && rawUserId !== null && String(rawUserId).trim() !== ''
      ? String(rawUserId).trim()
      : undefined,
    tipe_usaha: tipeUsaha,
    is_verified: normalizeIsVerified(item),
  };
}

function matchesTarget(
  record: M3PartnerRecord,
  options: FetchM3PartnerOptions
): boolean {
  const targetPartners = [options.partnerId, options.normalizedPartnerId]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());
  const targetUsers = [options.userId, options.normalizedUserId]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());

  if (targetPartners.length === 0 && targetUsers.length === 0) {
    return false;
  }
  if (targetPartners.includes(record.partner_id.toLowerCase())) {
    return true;
  }
  if (record.user_id && targetUsers.includes(record.user_id.toLowerCase())) {
    return true;
  }
  return false;
}

/**
 * Ambil data Partner (partner_id, tipe_usaha, is_verified) dari API Modul 3.
 * Mengembalikan null (tanpa throw) jika M3 tidak terkonfigurasi, timeout, atau error
 * sehingga fallback ke tabel lokal partner_profiles berjalan mulus.
 */
export async function fetchPartnerFromM3(
  options: FetchM3PartnerOptions
): Promise<M3PartnerRecord | null> {
  const baseUrl = (options.m3ApiUrl ?? process.env.M3_API_URL ?? '').trim();
  if (!baseUrl) return null;

  const url = buildM3PartnersUrl(baseUrl);
  const fetchFn = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 3000;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Service-Key': process.env.SERVICE_KEY || 'araya-m4-service-key-2026',
  };
  if (options.bearerToken) {
    headers.Authorization = options.bearerToken.startsWith('Bearer ')
      ? options.bearerToken
      : `Bearer ${options.bearerToken}`;
  }

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const candidates = extractPartnerCandidates(payload);

    for (const rawItem of candidates) {
      const parsed = parsePartnerRecord(rawItem);
      if (parsed && matchesTarget(parsed, options)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}
