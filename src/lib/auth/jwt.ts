import type { JwtPayload, Role } from './types';

const DEFAULT_DEV_SECRET = process.env.JWT_SECRET || 'araya-m1-jwt-dev-secret-key-2026';

// Preset mock tokens untuk kebutuhan testing dan integrasi awal sebelum M1 siap
const MOCK_TOKENS: Record<string, JwtPayload> = {
  'mock-admin-token': {
    sub: 'usr_mock_admin_001',
    user_id: 1,
    role: 'Admin',
    name: 'Administrator BPU',
    email: 'admin@araya.unpas.ac.id',
  },
  'mock-partner-token': {
    sub: 'usr_mock_partner_001',
    user_id: 2,
    role: 'Partner',
    name: 'Mitra Usaha Unpas',
    partner_id: 'ptr_01J9ZN5R1D',
    email: 'partner@unpas.ac.id',
  },
  'mock-customer-token': {
    sub: 'usr_01J9ZP2A8C',
    user_id: 17,
    role: 'Customer',
    name: 'Budi Santoso',
    email: 'budi@example.com',
  },
};

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array | string): string {
  let binary = '';
  const bytes = typeof buffer === 'string' ? new TextEncoder().encode(buffer) : new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Buat JWT bertanda tangan HMAC-SHA256 menggunakan Web Crypto API native
 */
export async function createJwtToken(
  payload: Partial<JwtPayload> & { sub?: string; user_id?: number | string; role: Role | string },
  secret: string = DEFAULT_DEV_SECRET,
  expiresInSeconds: number = 3600
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const subValue = payload.sub || (payload.user_id !== undefined ? String(payload.user_id) : 'usr_default');

  const fullPayload: JwtPayload = {
    iat: now,
    exp: now + expiresInSeconds,
    sub: subValue,
    ...payload,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const encodedSignature = base64UrlEncode(signature);

  return `${message}.${encodedSignature}`;
}

/**
 * Verifikasi token JWT (atau token preset mock jika dalam mode pengembangan)
 */
export async function verifyJwt(
  token: string,
  secret: string = DEFAULT_DEV_SECRET
): Promise<{ valid: boolean; payload?: JwtPayload; error?: string }> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token tidak boleh kosong' };
  }

  // 1. Dukungan mock preset token (sampai M1 siap sepenuhnya)
  if (MOCK_TOKENS[token]) {
    return { valid: true, payload: { ...MOCK_TOKENS[token] } };
  }

  // 2. Parse komponen JWT (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format JWT tidak valid' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    return { valid: false, error: 'Payload JWT tidak dapat diurai' };
  }

  // 3. Validasi masa berlaku (exp)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return { valid: false, error: 'Token telah kedaluwarsa' };
  }

  // Format token M1 (user_id) dan standar sub
  if (!payload.sub && payload.user_id !== undefined) {
    payload.sub = String(payload.user_id);
  }

  // 4. Validasi sub dan role wajib
  if (!payload.sub || !payload.role) {
    return { valid: false, error: 'Klaim sub atau role tidak ditemukan pada token' };
  }

  const validRoles: string[] = ['admin', 'partner', 'customer', 'kasir'];
  if (!validRoles.includes(String(payload.role).toLowerCase())) {
    return { valid: false, error: `Role '${payload.role}' tidak dikenali sistem` };
  }

  // 5. Verifikasi tanda tangan kriptografis HMAC-SHA256
  try {
    const key = await getCryptoKey(secret);
    const message = `${headerB64}.${payloadB64}`;
    
    // Decode signature
    const binarySig = base64UrlDecode(signatureB64);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isSigValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(message)
    );

    if (!isSigValid) {
      return { valid: false, error: 'Tanda tangan kriptografi token tidak valid' };
    }
  } catch {
    return { valid: false, error: 'Gagal memverifikasi tanda tangan token' };
  }

  return { valid: true, payload };
}
