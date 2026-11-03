export type ProductCategory = "Produk" | "Jasa";

export type ProductStatus = "Aktif" | "Nonaktif";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  /** Nilai uang disimpan sebagai string desimal sesuai standar integritas finansial Modul 4 */
  price: string;
  description: string;
  status: ProductStatus;
  createdAt?: string;
}

export interface ProductForm {
  name: string;
  category: "" | ProductCategory;
  price: string;
  description: string;
}

export interface ProductFormErrors {
  name?: string;
  category?: string;
  price?: string;
}
