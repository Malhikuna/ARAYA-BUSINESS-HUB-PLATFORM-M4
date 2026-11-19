import { ProductItem, BusinessMode } from "@/types/product";
import { ProductMetrics } from "@/components/produk/ProductMetricCards";

export interface ProductFilterOptions {
  businessMode: BusinessMode;
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
  selectedStock: string;
  selectedUnit: string;
  selectedPrice: string;
}

/**
 * Memfilter dan mengurutkan data produk & jasa berdasarkan parameter toolbar katalog.
 */
export function filterAndSortProducts(
  products: ProductItem[],
  options: ProductFilterOptions
): ProductItem[] {
  const { businessMode, searchTerm, selectedCategory, selectedStatus, selectedStock, selectedUnit, selectedPrice } = options;
  const query = searchTerm.trim().toLowerCase();
  const isServiceContext = businessMode === "Jasa" || (businessMode === "Semua" && selectedCategory === "Jasa");

  const matched = products.filter((item) => {
    if (businessMode === "Produk" && item.category !== "Produk") return false;
    if (businessMode === "Jasa" && item.category !== "Jasa") return false;

    const matchSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    if (!matchSearch) return false;

    const matchCategory =
      businessMode !== "Semua" ? true : selectedCategory === "Semua kategori" || item.category === selectedCategory;
    if (!matchCategory) return false;

    const matchStatus = selectedStatus === "Semua status" || item.status === selectedStatus;
    if (!matchStatus) return false;

    // Filter ketersediaan stok untuk Produk
    if (!isServiceContext && selectedStock !== "Semua stok") {
      if (item.category === "Produk") {
        const stock = item.stock ?? 0;
        if (selectedStock === "Tersedia (≥ 10)" && stock < 10) return false;
        if (selectedStock === "Stok menipis (≤ 5)" && (stock <= 0 || stock > 5)) return false;
        if (selectedStock === "Stok habis (0)" && stock !== 0) return false;
      } else if (
        selectedStock === "Tersedia (≥ 10)" ||
        selectedStock === "Stok menipis (≤ 5)" ||
        selectedStock === "Stok habis (0)"
      ) {
        return false;
      }
    }

    // Filter satuan penagihan untuk Jasa
    if (isServiceContext && selectedUnit !== "Semua satuan") {
      const itemUnit = (item.unit || "").toLowerCase();
      const target = selectedUnit.replace(/^per\s+/i, "").toLowerCase();
      if (!itemUnit.includes(target)) return false;
    }

    // Filter rentang nominal harga
    const priceNum = parseFloat(item.price) || 0;
    if (selectedPrice === "Di bawah Rp 1 Jt" && priceNum >= 1000000) return false;
    if (selectedPrice === "Rp 1 Jt - Rp 5 Jt" && (priceNum < 1000000 || priceNum > 5000000)) return false;
    if (selectedPrice === "Di atas Rp 5 Jt" && priceNum <= 5000000) return false;

    return true;
  });

  return [...matched].sort((a, b) => {
    // Status Aktif selalu di atas, status Nonaktif selalu paling bawah
    const aIsActive = a.status === "Aktif";
    const bIsActive = b.status === "Aktif";
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Jika status sama, terapkan urutan harga jika dipilih
    if (selectedPrice === "Harga: Terendah") {
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    }
    if (selectedPrice === "Harga: Tertinggi") {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    }

    return 0;
  });
}

/**
 * Menghitung ringkasan metrik 4 card statistik katalog produk dan jasa.
 */
export function computeProductMetrics(
  products: ProductItem[],
  recentSavedProducts: ProductItem[]
): ProductMetrics {
  const physicalItems = products.filter((p) => p.category === "Produk");
  const serviceItems = products.filter((p) => p.category === "Jasa");
  const totalWarehouseUnits = physicalItems.reduce((acc, p) => acc + (p.stock ?? 0), 0);
  const lowStockCount = physicalItems.filter((p) => (p.stock ?? 0) <= 5).length;
  const serviceUnits = Array.from(
    new Set(serviceItems.map((p) => p.unit?.trim()).filter(Boolean) as string[])
  );

  return {
    totalCount: products.length,
    physicalCount: physicalItems.length,
    serviceCount: serviceItems.length,
    inactiveCount: products.filter((p) => p.status === "Nonaktif").length,
    recentTotalCount: recentSavedProducts.length,
    recentPhysicalCount: recentSavedProducts.filter((p) => p.category === "Produk").length,
    recentServiceCount: recentSavedProducts.filter((p) => p.category === "Jasa").length,
    totalWarehouseUnits,
    lowStockCount,
    serviceUnits,
  };
}

