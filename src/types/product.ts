export type ProductCategory = "Produk" | "Jasa";

export type ProductStatus = "Aktif" | "Nonaktif";

export type BusinessMode = "Semua" | "Produk" | "Jasa";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  /** Nilai uang disimpan sebagai string desimal sesuai standar integritas finansial Modul 4 */
  price: string;
  description: string;
  status: ProductStatus;
  /** Kuantitas stok fisik di gudang (khusus kategori Produk) */
  stock?: number;
  /** Satuan unit item: Produk (Unit, Pcs, Rim, Box) atau Jasa (Jam, Sesi, Paket, Bulan, Proyek) */
  unit?: string;
  createdAt?: string;
}

export interface ProductForm {
  name: string;
  category: "" | ProductCategory;
  price: string;
  description: string;
  stock?: string;
  unit?: string;
}

export interface ProductFormErrors {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  unit?: string;
}
