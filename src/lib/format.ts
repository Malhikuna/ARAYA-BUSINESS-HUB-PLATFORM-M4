// Zona waktu dikunci agar render server (UTC) dan browser menghasilkan teks yang sama.
const TIME_ZONE = "Asia/Jakarta";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: "stripIfInteger",
});

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: TIME_ZONE,
});

const tanggalWaktuFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

/**
 * Format nilai uang ke Rupiah, mis. "194250.00" -> "Rp 194.250".
 * Menerima number, bigint, atau string desimal dari API (mis. "194250.00").
 */
export function formatRupiah(value: number | bigint | string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Rp 0";
    try {
      return (rupiahFormatter.format as (val: unknown) => string)(trimmed);
    } catch {
      const num = Number(trimmed);
      return Number.isNaN(num) ? "Rp 0" : rupiahFormatter.format(num);
    }
  }
  return rupiahFormatter.format(value);
}

/** Format tanggal, mis. "2026-10-21" -> "21 Oktober 2026". */
export function formatTanggal(value: Date | string | number): string {
  return tanggalFormatter.format(new Date(value));
}

/** Format tanggal + jam WIB, mis. "21 Oktober 2026 pukul 22.11". */
export function formatTanggalWaktu(value: Date | string | number): string {
  return tanggalWaktuFormatter.format(new Date(value));
}
