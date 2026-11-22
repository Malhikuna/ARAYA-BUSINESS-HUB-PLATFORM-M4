/**
 * Susun tautan WhatsApp resmi (https://wa.me/62...) dari nomor telepon Indonesia.
 * Mengembalikan null bila nomor kosong atau terlalu pendek agar tidak merender link invalid.
 */
export function buildWhatsAppUrl(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("8")
    ? `62${digits}`
    : digits;
  return `https://wa.me/${normalized}`;
}
