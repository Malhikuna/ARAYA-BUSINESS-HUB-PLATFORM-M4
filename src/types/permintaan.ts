export type PermintaanStatus = "Baru" | "Sudah ditawarkan";

export interface PermintaanItem {
  id: string; // PMT-0007
  ticketId: string; // #REQ-9921
  title: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string;
  customerId?: string;
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
  quotationNumber?: string; // e.g. "PNW-0004"
}
