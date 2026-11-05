import { ProductCategory, ProductItem, BusinessMode } from "@/types/product";

export const initialProducts: ProductItem[] = [
  { id: "ITEM-001", sku: "SRV-CNS-01", name: "Paket konsultasi bisnis", category: "Jasa", price: "1500000.00", description: "Sesi evaluasi strategi usaha dan pendampingan manajemen keuangan per jam.", status: "Aktif", unit: "Jam" },
  { id: "ITEM-002", sku: "SRV-DSG-04", name: "Jasa desain logo", category: "Jasa", price: "750000.00", description: "Pembuatan konsep identitas visual dan panduan warna brand perusahaan.", status: "Aktif", unit: "Paket" },
  { id: "ITEM-003", sku: "PRD-LPT-02", name: "Laptop kantor 14 inci", category: "Produk", price: "8900000.00", description: "Perangkat kerja Intel Core i5, RAM 16 GB, SSD 512 GB dengan garansi resmi.", status: "Aktif", stock: 15, unit: "Unit" },
  { id: "ITEM-004", sku: "SRV-TRN-03", name: "Paket pelatihan tim", category: "Jasa", price: "3250000.00", description: "Workshop peningkatan kapasitas staf operasional dan manajemen proyek.", status: "Nonaktif", unit: "Sesi" },
  { id: "ITEM-005", sku: "PRD-SRV-09", name: "Server rack mount 1U", category: "Produk", price: "16500000.00", description: "Unit rak server enterprise untuk penyimpanan database internal perusahaan.", status: "Aktif", stock: 4, unit: "Unit" },
  { id: "ITEM-006", sku: "SRV-MNT-02", name: "Pemeliharaan jaringan bulanan", category: "Jasa", price: "2100000.00", description: "Kunjungan rutin pengecekan perangkat jaringan, firewall, dan optimasi koneksi kantor.", status: "Aktif", unit: "Bulan" },
  { id: "ITEM-007", sku: "PRD-RTR-05", name: "Router enterprise dual-WAN", category: "Produk", price: "2450000.00", description: "Perangkat router bisnis dengan fitur load balancing dan proteksi VPN terintegrasi.", status: "Aktif", stock: 8, unit: "Unit" },
  { id: "ITEM-008", sku: "SRV-AUD-01", name: "Audit keamanan sistem IT", category: "Jasa", price: "5500000.00", description: "Pengujian celah keamanan infrastruktur server dan rekomendasi mitigasi risiko data.", status: "Aktif", unit: "Proyek" },
  { id: "ITEM-009", sku: "PRD-MON-07", name: "Monitor IPS 27 inci 4K", category: "Produk", price: "4200000.00", description: "Layar kerja resolusi tinggi dengan akurasi warna sRGB 99% dan dudukan ergonomis.", status: "Aktif", stock: 12, unit: "Unit" },
  { id: "ITEM-010", sku: "SRV-CLD-06", name: "Migrasi database cloud", category: "Jasa", price: "4800000.00", description: "Layanan pemindahan basis data on-premise ke server cloud tanpa waktu henti operasional.", status: "Aktif", unit: "Proyek" },
  { id: "ITEM-011", sku: "PRD-PRN-03", name: "Printer laser multifungsi", category: "Produk", price: "3650000.00", description: "Mesin cetak dokumen bisnis dengan fitur cetak bolak-balik otomatis dan koneksi LAN.", status: "Aktif", stock: 6, unit: "Unit" },
  { id: "ITEM-012", sku: "SRV-ERP-08", name: "Implementasi modul akuntansi", category: "Jasa", price: "7500000.00", description: "Konfigurasi bagan akun standar, saldo awal, dan pelatihan tim keuangan perusahaan.", status: "Aktif", unit: "Paket" },
  { id: "ITEM-013", sku: "PRD-UPS-04", name: "UPS smart backup 1500VA", category: "Produk", price: "2850000.00", description: "Cadangan daya otomatis dengan penstabil tegangan untuk melindungi server dari mati listrik.", status: "Aktif", stock: 5, unit: "Unit" },
  { id: "ITEM-014", sku: "SRV-WEB-05", name: "Pengembangan portal korporat", category: "Jasa", price: "6200000.00", description: "Pembuatan situs web profil bisnis responsif lengkap dengan sistem manajemen konten.", status: "Aktif", unit: "Proyek" },
  { id: "ITEM-015", sku: "PRD-SWT-06", name: "Switch managed 24-port gigabit", category: "Produk", price: "3100000.00", description: "Switch distribusi jaringan kantor dengan pengaturan VLAN dan pemantauan trafik.", status: "Aktif", stock: 9, unit: "Unit" },
  { id: "ITEM-016", sku: "SRV-SEO-07", name: "Optimasi visibilitas mesin pencari", category: "Jasa", price: "1850000.00", description: "Audit kata kunci, perbaikan struktur halaman web, dan laporan performa trafik bulanan.", status: "Nonaktif", unit: "Bulan" },
  { id: "ITEM-017", sku: "PRD-NAS-08", name: "Storage NAS 4-bay 16TB", category: "Produk", price: "9400000.00", description: "Penyimpanan jaringan terpusat dengan dukungan konfigurasi RAID untuk berbagi dokumen tim.", status: "Aktif", stock: 3, unit: "Unit" },
  { id: "ITEM-018", sku: "SRV-SUP-09", name: "Dukungan teknis prioritas 24/7", category: "Jasa", price: "2750000.00", description: "Layanan bantuan kendala perangkat keras dan lunak dengan jaminan waktu respons cepat.", status: "Aktif", unit: "Bulan" },
  { id: "ITEM-019", sku: "PRD-SCN-10", name: "Scanner dokumen kecepatan tinggi", category: "Produk", price: "4500000.00", description: "Pemindai kertas otomatis untuk digitalisasi arsip faktur, kontrak, dan surat jalan.", status: "Aktif", stock: 7, unit: "Unit" },
  { id: "ITEM-020", sku: "SRV-UIX-10", name: "Perancangan antarmuka aplikasi", category: "Jasa", price: "4100000.00", description: "Pembuatan purwarupa interaktif dan sistem desain untuk aplikasi internal perusahaan.", status: "Aktif", unit: "Proyek" },
  { id: "ITEM-021", sku: "PRD-PRJ-11", name: "Proyektor ruang rapat Full HD", category: "Produk", price: "5300000.00", description: "Proyektor tingkat kecerahan 4000 lumens untuk presentasi di ruang konferensi.", status: "Aktif", stock: 2, unit: "Unit" },
  { id: "ITEM-022", sku: "SRV-DEV-11", name: "Integrasi API pembayaran", category: "Jasa", price: "3400000.00", description: "Penyambungan sistem kasir dan tagihan dengan layanan gerbang pembayaran otomatis.", status: "Aktif", unit: "Proyek" },
  { id: "ITEM-023", sku: "SRV-BAK-12", name: "Layanan pencadangan data harian", category: "Jasa", price: "1200000.00", description: "Otomatisasi salinan cadangan dokumen transaksi penting ke penyimpanan terenkripsi.", status: "Aktif", unit: "Bulan" },
  { id: "ITEM-024", sku: "SRV-TAX-13", name: "Pendampingan kepatuhan e-Faktur", category: "Jasa", price: "2300000.00", description: "Asistensi rekonsiliasi pajak pertambahan nilai dan pelaporan administrasi faktur penjualan.", status: "Aktif", unit: "Bulan" },
];

export function generateProductSku(name: string, category: ProductCategory): string {
  const prefix = category === "Produk" ? "PRD" : "SRV";
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  let charSum = 0;
  for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
  const digits = String((charSum % 90) + 10);
  return `${prefix}-${letters}-${digits}`;
}

export function subscribeProductStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("araya-product-storage-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-product-storage-update", callback);
  };
}

export function getStoredProducts(): string {
  if (typeof window === "undefined") return "[]";
  return sessionStorage.getItem("araya_added_products") || "[]";
}
export const getServerStoredProducts = () => "[]";

export function getStoredUpdatedProducts(): string {
  if (typeof window === "undefined") return "{}";
  return sessionStorage.getItem("araya_updated_products") || "{}";
}
export const getServerStoredUpdatedProducts = () => "{}";

export function getStoredDeletedProducts(): string {
  if (typeof window === "undefined") return "[]";
  return sessionStorage.getItem("araya_deleted_products") || "[]";
}
export const getServerStoredDeletedProducts = () => "[]";

export function getStoredBusinessMode(): BusinessMode {
  if (typeof window === "undefined") return "Semua";
  const stored = localStorage.getItem("araya_business_mode");
  if (stored === "Produk" || stored === "Jasa" || stored === "Semua") return stored;
  return "Semua";
}
export const getServerStoredBusinessMode = (): BusinessMode => "Semua";

export function saveBusinessModeToStorage(mode: BusinessMode): void {
  try {
    localStorage.setItem("araya_business_mode", mode);
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch { /* ignore */ }
}

export function saveNewProductToStorage(newItem: ProductItem): void {
  try {
    const raw = sessionStorage.getItem("araya_added_products");
    const existing: ProductItem[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem("araya_added_products", JSON.stringify([newItem, ...existing]));
    sessionStorage.setItem("araya_product_toast", "created");
    sessionStorage.setItem("araya_product_toast_name", newItem.name);
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch { /* ignore */ }
}

export function saveImportedProductsToStorage(newItems: ProductItem[]): void {
  try {
    const raw = sessionStorage.getItem("araya_added_products");
    const existing: ProductItem[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem("araya_added_products", JSON.stringify([...newItems, ...existing]));
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch { /* ignore */ }
}

export function saveUpdatedProductToStorage(updatedItem: ProductItem): void {
  try {
    const rawUpdates = sessionStorage.getItem("araya_updated_products");
    const updatesMap: Record<string, ProductItem> = rawUpdates ? JSON.parse(rawUpdates) : {};
    updatesMap[updatedItem.id] = updatedItem;
    sessionStorage.setItem("araya_updated_products", JSON.stringify(updatesMap));

    const rawAdded = sessionStorage.getItem("araya_added_products");
    if (rawAdded) {
      const addedList: ProductItem[] = JSON.parse(rawAdded);
      sessionStorage.setItem("araya_added_products", JSON.stringify(addedList.map((p) => (p.id === updatedItem.id ? updatedItem : p))));
    }

    sessionStorage.setItem("araya_product_toast", "updated");
    sessionStorage.setItem("araya_product_toast_name", updatedItem.name);
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch { /* ignore */ }
}

export function deleteProductFromStorage(targetId: string): void {
  try {
    const rawDel = sessionStorage.getItem("araya_deleted_products");
    const deletedList: string[] = rawDel ? JSON.parse(rawDel) : [];
    if (!deletedList.includes(targetId)) {
      sessionStorage.setItem("araya_deleted_products", JSON.stringify([...deletedList, targetId]));
    }
    const rawAdded = sessionStorage.getItem("araya_added_products");
    if (rawAdded) {
      const addedList: ProductItem[] = JSON.parse(rawAdded);
      sessionStorage.setItem("araya_added_products", JSON.stringify(addedList.filter((p) => p.id !== targetId)));
    }
    window.dispatchEvent(new Event("araya-product-storage-update"));
  } catch { /* ignore */ }
}

export function findProductById(id: string): ProductItem | null {
  if (!id) return null;
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = sessionStorage.getItem("araya_deleted_products");
      if (deletedRaw && (JSON.parse(deletedRaw) as string[]).includes(id)) return null;
    } catch { /* ignore */ }
    try {
      const updatedRaw = sessionStorage.getItem("araya_updated_products");
      if (updatedRaw) {
        const updatedMap: Record<string, ProductItem> = JSON.parse(updatedRaw);
        if (updatedMap[id]) return updatedMap[id];
      }
    } catch { /* ignore */ }
    try {
      const addedRaw = sessionStorage.getItem("araya_added_products");
      if (addedRaw) {
        const found = (JSON.parse(addedRaw) as ProductItem[]).find((item) => item.id === id);
        if (found) return found;
      }
    } catch { /* ignore */ }
  }
  return initialProducts.find((item) => item.id === id) || null;
}

export function parseProductCsvContent(text: string): {
  items: Omit<ProductItem, "id" | "createdAt">[];
  error: string | null;
} {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { items: [], error: "Berkas CSV kosong. Pastikan berkas memiliki baris data katalog." };
  }
  const dataLines = /nama|sku|kategori/i.test(lines[0]) ? lines.slice(1) : lines;
  if (dataLines.length === 0) {
    return { items: [], error: "Berkas CSV tidak memiliki baris data selain baris judul/header." };
  }
  const items: Omit<ProductItem, "id" | "createdAt">[] = dataLines.slice(0, 50).map((line, index) => {
    const cols = line.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const rawName = cols[0] || `Item Impor ${index + 1}`;
    const rawCat: ProductCategory = cols[1]?.toLowerCase() === "produk" ? "Produk" : "Jasa";
    const digitsPrice = (cols[2] || "500000").replace(/\D/g, "").slice(0, 15) || "500000";
    const rawDesc = cols[3] || `Item ${rawCat.toLowerCase()} hasil impor berkas katalog CSV.`;
    const prefix = rawCat === "Produk" ? "PRD" : "SRV";
    const code = rawName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "IMP";
    const rawStock = rawCat === "Produk" ? (parseInt(cols[4] || "10", 10) || 0) : undefined;
    const rawUnit = cols[5] || (rawCat === "Produk" ? "Unit" : "Paket");

    return {
      sku: `${prefix}-${code}-${String(index + 1).padStart(2, "0")}`,
      name: rawName,
      category: rawCat,
      price: `${digitsPrice}.00`,
      description: rawDesc,
      status: "Aktif",
      stock: rawStock,
      unit: rawUnit,
    };
  });
  return { items, error: null };
}
