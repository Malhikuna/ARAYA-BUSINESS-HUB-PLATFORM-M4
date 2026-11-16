export interface SeedCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const SEED_CUSTOMERS: SeedCustomer[] = [
  // 1. Mitra Korporat & Industri
  {
    name: 'PT Maju Bersama',
    email: 'procurement@majubersama.co.id',
    phone: '081234567890',
    address: 'Jl. Asia Afrika No. 120, Bandung, Jawa Barat',
  },
  {
    name: 'CV Karya Mandiri',
    email: 'finance@karyamandiri.com',
    phone: '081398765432',
    address: 'Jl. Dago No. 45, Bandung, Jawa Barat',
  },
  {
    name: 'PT Pasundan Digital Niaga',
    email: 'partnership@pasundandigital.id',
    phone: '082112345678',
    address: 'Menara Mandiri Lt. 12, Jl. Jend. Sudirman, Jakarta Selatan',
  },
  {
    name: 'PT Telkom Indonesia Witel Jabar',
    email: 'vendor.management@telkom.co.id',
    phone: '081223344556',
    address: 'Jl. Lembong No. 11, Bandung, Jawa Barat',
  },
  {
    name: 'Bank BJB Cabang Tamansari',
    email: 'operasional.tamansari@bankbjb.co.id',
    phone: '081122334455',
    address: 'Jl. Tamansari No. 24, Bandung, Jawa Barat',
  },
  {
    name: 'PT Bio Farma (Persero)',
    email: 'procurement@biofarma.co.id',
    phone: '081299887766',
    address: 'Jl. Pasteur No. 28, Bandung, Jawa Barat',
  },
  {
    name: 'CV Berkah Grafika Mandiri',
    email: 'berkah.grafika@gmail.com',
    phone: '081908765432',
    address: 'Jl. Cihampelas No. 160, Bandung, Jawa Barat',
  },
  {
    name: 'PT Wijaya Graha Pratama',
    email: 'contact@wijayagraha.com',
    phone: '082133445566',
    address: 'Jl. Soekarno Hatta No. 590, Bandung, Jawa Barat',
  },

  // 2. Lembaga, Fakultas & Unit Kampus Unpas
  {
    name: 'Biro Kemahasiswaan Unpas (BAK)',
    email: 'bak@unpas.ac.id',
    phone: '081298765432',
    address: 'Kampus II Unpas, Jl. Tamansari No. 6-8, Bandung, Jawa Barat',
  },
  {
    name: 'Fakultas Teknik Unpas',
    email: 'dekanat.ft@unpas.ac.id',
    phone: '081322114455',
    address: 'Kampus IV Unpas, Jl. Dr. Setiabudhi No. 193, Bandung, Jawa Barat',
  },
  {
    name: 'Fakultas Hukum Unpas',
    email: 'dekanat.fh@unpas.ac.id',
    phone: '081211335577',
    address: 'Kampus II Unpas, Jl. Lengkong Besar No. 68, Bandung, Jawa Barat',
  },
  {
    name: 'Fakultas Ekonomi & Bisnis Unpas',
    email: 'dekanat.feb@unpas.ac.id',
    phone: '081388990011',
    address: 'Kampus II Unpas, Jl. Tamansari No. 6-8, Bandung, Jawa Barat',
  },
  {
    name: 'Lembaga Penelitian & Pengabdian Unpas (LPPM)',
    email: 'lppm@unpas.ac.id',
    phone: '081233449900',
    address: 'Gedung Rektorat Unpas Lt. 3, Jl. Tamansari No. 6-8, Bandung',
  },
  {
    name: 'Koperasi Mahasiswa Unpas (Kopma)',
    email: 'kopma@unpas.ac.id',
    phone: '085678901234',
    address: 'Student Center Unpas, Jl. Tamansari No. 6-8, Bandung, Jawa Barat',
  },

  // 3. Dinas / Instansi Pemerintah
  {
    name: 'Dinas Koperasi & UMKM Kota Bandung',
    email: 'diskukm@bandung.go.id',
    phone: '082211998877',
    address: 'Jl. Kawaluyaan No. 2, Bandung, Jawa Barat',
  },
  {
    name: 'Bappeda Provinsi Jawa Barat',
    email: 'sekretariat@bappeda.jabarprov.go.id',
    phone: '081199884422',
    address: 'Jl. Ir. H. Juanda No. 287, Bandung, Jawa Barat',
  },

  // 4. Perorangan, Dosen, dan Customer Tamu E-Commerce (M5)
  {
    name: 'Dudi Santoso',
    email: 'dudi.santoso@gmail.com',
    phone: '081711223344',
    address: 'Jl. Buah Batu No. 88, Bandung, Jawa Barat',
  },
  {
    name: 'Prof. Dr. Ir. H. Ahmad Sudrajat, M.Sc.',
    email: 'ahmad.sudrajat@unpas.ac.id',
    phone: '081220011223',
    address: 'Komplek Dosen Unpas Cipaganti No. 14, Bandung, Jawa Barat',
  },
  {
    name: 'Rina Marlina (Customer Tamu)',
    email: 'rina.marlina@gmail.com',
    phone: '087712349988',
    address: 'Komplek Permata Cimahi Blok D-15, Cimahi, Jawa Barat',
  },
  {
    name: 'Hendra Pratama Wijaya',
    email: 'hendra.pratama@gmail.com',
    phone: '085722334455',
    address: 'Jl. Gegerkalong Hilir No. 72, Bandung, Jawa Barat',
  },
];
