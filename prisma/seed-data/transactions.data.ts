/**
 * Template transaksi penawaran, pesanan, dan tagihan
 * Mencerminkan operasional BPU Unpas selama 1 tahun berjalan
 */

export interface SeedQuotationDef {
  number: string;
  customerEmail: string;
  sku: string;
  quantity: number;
  status: 'PENDING_APPROVAL' | 'APPROVED';
  daysAgo: number;
  validDays: number;
  notes: string;
}

export const SEED_QUOTATION_TEMPLATES: SeedQuotationDef[] = [
  // Periode Awal Tahun (Q1)
  {
    number: 'PNW-202601-0001',
    customerEmail: 'bak@unpas.ac.id',
    sku: 'PRD-ALUM-002',
    quantity: 120,
    status: 'APPROVED',
    daysAgo: 310,
    validDays: 30,
    notes: 'Pengadaan Jas Almamater Mahasiswa Baru Gelombang 1',
  },
  {
    number: 'PNW-202602-0002',
    customerEmail: 'dekanat.ft@unpas.ac.id',
    sku: 'SRV-LABS-005',
    quantity: 15,
    status: 'APPROVED',
    daysAgo: 275,
    validDays: 20,
    notes: 'Uji Laboratorium Sampel Penelitian Hibah Dosen',
  },
  {
    number: 'PNW-202603-0003',
    customerEmail: 'procurement@telkom.co.id',
    sku: 'SRV-CONS-001',
    quantity: 20,
    status: 'APPROVED',
    daysAgo: 245,
    validDays: 30,
    notes: 'Konsultasi Pengembangan Inkubator Startup Digital Telkom',
  },

  // Periode Tengah Tahun (Q2 & Q3)
  {
    number: 'PNW-202605-0004',
    customerEmail: 'diskukm@bandung.go.id',
    sku: 'SRV-TRNG-004',
    quantity: 40,
    status: 'APPROVED',
    daysAgo: 190,
    validDays: 14,
    notes: 'Pelatihan Kewirausahaan Bagi 40 Pelaku UMKM Binaan',
  },
  {
    number: 'PNW-202607-0005',
    customerEmail: 'sekretariat@bappeda.jabarprov.go.id',
    sku: 'AST-DOME-009',
    quantity: 2,
    status: 'APPROVED',
    daysAgo: 130,
    validDays: 30,
    notes: 'Sewa Gedung Mandala Saba untuk Musrenbang Provinsi Jabar',
  },
  {
    number: 'PNW-202608-0006',
    customerEmail: 'kopma@unpas.ac.id',
    sku: 'PRD-MERCH-003',
    quantity: 250,
    status: 'APPROVED',
    daysAgo: 95,
    validDays: 14,
    notes: 'Paket Seminar Kit Ospek Mahasiswa Baru Kopma',
  },
  {
    number: 'PNW-202609-0007',
    customerEmail: 'operasional.tamansari@bankbjb.co.id',
    sku: 'PRD-PLKT-004',
    quantity: 25,
    status: 'APPROVED',
    daysAgo: 65,
    validDays: 14,
    notes: 'Pembuatan Plakat Penghargaan Mitra Loyal Bank BJB',
  },

  // Periode Akhir Tahun (Q4 - Sedang Berjalan)
  {
    number: 'PNW-202611-0021',
    customerEmail: 'bak@unpas.ac.id',
    sku: 'PRD-ALUM-002',
    quantity: 60,
    status: 'PENDING_APPROVAL',
    daysAgo: 5,
    validDays: 14,
    notes: 'Pengadaan Jaket Almamater Tambahan Semester Antara',
  },
  {
    number: 'PNW-202611-0022',
    customerEmail: 'procurement@majubersama.co.id',
    sku: 'SRV-CONS-001',
    quantity: 10,
    status: 'PENDING_APPROVAL',
    daysAgo: 3,
    validDays: 14,
    notes: 'Pendampingan Manajemen Mutu ISO 9001:2015 Q4',
  },
  {
    number: 'PNW-202611-0023',
    customerEmail: 'finance@karyamandiri.com',
    sku: 'AST-ROOM-003',
    quantity: 3,
    status: 'PENDING_APPROVAL',
    daysAgo: 2,
    validDays: 14,
    notes: 'Sewa Ruang Rapat Evaluasi Kinerja Akhir Tahun',
  },
  {
    number: 'PNW-202611-0024',
    customerEmail: 'dekanat.fh@unpas.ac.id',
    sku: 'PRD-BOOK-001',
    quantity: 150,
    status: 'PENDING_APPROVAL',
    daysAgo: 1,
    validDays: 20,
    notes: 'Pencetakan Buku Ajar Pengantar Ilmu Hukum Edisi 2026',
  },
  {
    number: 'PNW-202611-0025',
    customerEmail: 'partnership@pasundandigital.id',
    sku: 'SRV-AUDT-006',
    quantity: 1,
    status: 'PENDING_APPROVAL',
    daysAgo: 0,
    validDays: 30,
    notes: 'Audit Kesiapan Keamanan Data Pusat Server',
  },
];

export interface SeedOrderDef {
  number: string;
  customerEmail: string;
  sku: string;
  quantity: number;
  status: 'baru' | 'diproses' | 'selesai' | 'dibatalkan';
  daysAgo: number;
}

export const SEED_ORDER_TEMPLATES: SeedOrderDef[] = [
  // Transaksi Checkout E-Commerce (M5) Historis
  {
    number: 'ORD-202602-0001',
    customerEmail: 'dudi.santoso@gmail.com',
    sku: 'PRD-BOOK-001',
    quantity: 2,
    status: 'selesai',
    daysAgo: 270,
  },
  {
    number: 'ORD-202604-0002',
    customerEmail: 'rina.marlina@gmail.com',
    sku: 'PRD-POLO-005',
    quantity: 3,
    status: 'selesai',
    daysAgo: 210,
  },
  {
    number: 'ORD-202606-0003',
    customerEmail: 'hendra.pratama@gmail.com',
    sku: 'PRD-BAG-006',
    quantity: 1,
    status: 'selesai',
    daysAgo: 160,
  },
  {
    number: 'ORD-202608-0004',
    customerEmail: 'rina.marlina@gmail.com',
    sku: 'PRD-TMBL-009',
    quantity: 5,
    status: 'selesai',
    daysAgo: 90,
  },
  {
    number: 'ORD-202610-0005',
    customerEmail: 'dudi.santoso@gmail.com',
    sku: 'PRD-NOTB-014',
    quantity: 10,
    status: 'selesai',
    daysAgo: 35,
  },
  // Transaksi Checkout E-Commerce (M5) Terkini
  {
    number: 'ORD-202611-0006',
    customerEmail: 'rina.marlina@gmail.com',
    sku: 'PRD-MERCH-003',
    quantity: 15,
    status: 'diproses',
    daysAgo: 4,
  },
  {
    number: 'ORD-202611-0007',
    customerEmail: 'hendra.pratama@gmail.com',
    sku: 'PRD-PAYG-015',
    quantity: 4,
    status: 'baru',
    daysAgo: 1,
  },
  {
    number: 'ORD-202611-0008',
    customerEmail: 'dudi.santoso@gmail.com',
    sku: 'PRD-POLO-005',
    quantity: 2,
    status: 'baru',
    daysAgo: 0,
  },
];
