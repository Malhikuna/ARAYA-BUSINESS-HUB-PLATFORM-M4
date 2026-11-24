/**
 * Normalisasi nomor telepon Indonesia (08..., 8..., +62..., 62...) menjadi digit berawalan 62.
 */
export function normalizeWhatsAppDigits(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/**
 * Susun tautan WhatsApp resmi (https://wa.me/62...) dari nomor telepon Indonesia.
 * Mengembalikan null bila nomor kosong atau terlalu pendek agar tidak merender link invalid.
 */
export function buildWhatsAppUrl(phone?: string | null): string | null {
  const normalized = normalizeWhatsAppDigits(phone);
  if (normalized.length < 8) return null;
  return `https://wa.me/${normalized}`;
}
