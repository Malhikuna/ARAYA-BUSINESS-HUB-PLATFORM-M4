import { PermintaanItem } from "@/types/permintaan";

/**
 * Fallback dummy data untuk permintaan jika ID rujukan tidak ditemukan di storage.
 */
export function getFallbackPermintaan(id: string): PermintaanItem {
  return {
    id,
    ticketId: "#REQ-9921",
    title: "Pendampingan laporan keuangan Q4",
    customerName: "PT Maju Bersama",
    customerInitials: "MB",
    customerAvatarBg: "bg-blue-100 text-blue-700",
    customerId: "CUST-001",
    whatsapp: "0812 3456 7890",
    serviceName: "Pendampingan laporan keuangan",
    serviceCode: "SRV-FIN-02",
    date: "17 Nov 2026",
    time: "09:12 WIB",
    status: "Baru",
    message: "Kami butuh pendampingan penyusunan laporan keuangan Q4 untuk 3 cabang, target selesai akhir Desember.",
    source: "Katalog M5",
    scope: "3 Cabang perusahaan",
    contactPerson: "Budi Santoso",
    contactRole: "Manajer Keuangan",
    industry: "Klien Korporat B2B · Terverifikasi",
    createdAt: "2026-11-17T09:12:00.000Z",
  };
}
