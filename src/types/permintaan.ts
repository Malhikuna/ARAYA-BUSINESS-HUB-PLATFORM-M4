export type PermintaanStatus = "Baru" | "Sudah ditawarkan";

export interface PermintaanItem {
  id: string; // UUID backend atau PMT-0007 (mock)
  displayCode?: string; // Kode ringkas tampil di tabel/badge (mis. SR-A1B2C3D4 atau PMT-0007)
  ticketId: string; // #REQ-9921
  title: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string;
  customerId?: string;
  customerEmail?: string;
  whatsapp: string;
  serviceName: string;
  serviceCode: string;
  date: string; // "17 Nov 2026"
  time: string; // "09:12 WIB"
  status: PermintaanStatus;
  message: string;
  source: string; // "Katalog M5"
  scope: string; // "3 Cabang perusahaan"
  contactPerson: string; // "Budi Santoso"
  contactRole: string; // "Manajer Keuangan"
  industry: string; // "Sektor Industri Konsumsi · Terdaftar aktif sejak Jan 2026"
  createdAt: string; // ISO 8601
  quotationId?: string; // UUID penawaran terkait dari DB
  quotationNumber?: string; // e.g. "PNW-0004" atau "PNW-202611-0001"
}
