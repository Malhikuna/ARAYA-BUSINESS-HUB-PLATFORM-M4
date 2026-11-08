import { ProductCategory, ProductItem, BusinessMode } from "@/types/product";

export const initialProducts: ProductItem[] = [
  { id: "ITEM-001", sku: "SRV-CONS-001", name: "Paket konsultasi bisnis", category: "Jasa", price: "1500000.00", description: "Sesi evaluasi strategi usaha dan pendampingan manajemen keuangan per jam.", status: "Aktif", unit: "Jam" },
  { id: "ITEM-002", sku: "SRV-DSGN-002", name: "Jasa desain logo", category: "Jasa", price: "750000.00", description: "Pembuatan konsep identitas visual dan panduan warna brand perusahaan.", status: "Aktif", unit: "Paket" },
  { id: "ITEM-003", sku: "PRD-LPT-001", name: "Laptop kantor 14 inci", category: "Produk", price: "8900000.00", description: "Perangkat kerja Intel Core i5, RAM 16 GB, SSD 512 GB dengan garansi resmi.", status: "Aktif", stock: 15, unit: "Unit" },
  { id: "ITEM-004", sku: "PRD-SRV-002", name: "Server rack mount 1U", category: "Produk", price: "16500000.00", description: "Unit rak server enterprise untuk penyimpanan database internal perusahaan.", status: "Aktif", stock: 4, unit: "Unit" },
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
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("araya-product-storage-update", callback); };
}

export const getStoredProducts = () => typeof window === "undefined" ? "[]" : sessionStorage.getItem("araya_added_products") || "[]";
export const getServerStoredProducts = () => "[]";

export const getStoredUpdatedProducts = () => typeof window === "undefined" ? "{}" : sessionStorage.getItem("araya_updated_products") || "{}";
export const getServerStoredUpdatedProducts = () => "{}";

export const getStoredDeletedProducts = () => typeof window === "undefined" ? "[]" : sessionStorage.getItem("araya_deleted_products") || "[]";
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

const DEV_AUTH_HEADER = "Bearer mock-admin-token";

export async function syncProductsFromDatabase(): Promise<ProductItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/m4/v1/products?limit=100", {
      headers: { Authorization: DEV_AUTH_HEADER },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];

    const dbItems: ProductItem[] = json.data.map((row: {
      id: string;
      sku: string;
      name: string;
      type: string;
      price: string | number;
      description?: string | null;
      is_active?: boolean;
      unit?: string;
      stock?: number;
      created_at?: string;
    }) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      category: row.type === "PRODUCT" ? "Produk" : "Jasa",
      price: typeof row.price === "string" ? row.price : Number(row.price).toFixed(2),
      description: row.description || "",
      status: row.is_active !== false ? "Aktif" : "Nonaktif",
      stock: row.stock ?? (row.type === "PRODUCT" ? 0 : undefined),
      unit: row.unit || (row.type === "PRODUCT" ? "Unit" : "Paket"),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const rawLocal = sessionStorage.getItem("araya_added_products");
    const localItems: ProductItem[] = rawLocal ? JSON.parse(rawLocal) : [];
    const unsyncedLocal = localItems.filter(
      (loc) => !dbItems.some((db) => db.id === loc.id || db.sku === loc.sku || db.name.toLowerCase() === loc.name.toLowerCase())
    );
    const merged = [...unsyncedLocal, ...dbItems];

    sessionStorage.setItem("araya_added_products", JSON.stringify(merged));
    window.dispatchEvent(new Event("araya-product-storage-update"));
    return merged;
  } catch {
    return [];
  }
}

export function saveNewProductToStorage(newItem: ProductItem): void {
  try {
    const raw = sessionStorage.getItem("araya_added_products");
    const existing: ProductItem[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem("araya_added_products", JSON.stringify([newItem, ...existing]));
    sessionStorage.setItem("araya_product_toast", "created");
    sessionStorage.setItem("araya_product_toast_name", newItem.name);
    window.dispatchEvent(new Event("araya-product-storage-update"));

    // Sync ke PostgreSQL via API M4 (untuk Jasa, biarkan backend auto-generate SKU SRV-...)
    fetch("/api/m4/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify({
        ...(newItem.category === "Produk" ? { sku: newItem.sku } : {}),
        name: newItem.name,
        description: newItem.description,
        type: newItem.category === "Produk" ? "PRODUCT" : "SERVICE",
        price: parseFloat(newItem.price) || 0,
        unit: newItem.unit || "pcs",
        stock: newItem.category === "Produk" ? (newItem.stock || 0) : 0,
        is_active: newItem.status === "Aktif",
      }),
    })
      .then(() => syncProductsFromDatabase())
      .catch(() => {});
  } catch { /* ignore */ }
}

export function saveImportedProductsToStorage(newItems: ProductItem[]): void {
  try {
    const raw = sessionStorage.getItem("araya_added_products");
    const existing: ProductItem[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem("araya_added_products", JSON.stringify([...newItems, ...existing]));
    window.dispatchEvent(new Event("araya-product-storage-update"));

    // Sync bulk ke PostgreSQL via API M4
    fetch("/api/m4/v1/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify(
        newItems.map((item) => ({
          ...(item.category === "Produk" ? { sku: item.sku } : {}),
          name: item.name,
          description: item.description,
          type: item.category === "Produk" ? "PRODUCT" : "SERVICE",
          price: parseFloat(item.price) || 0,
          unit: item.unit || "pcs",
          stock: item.category === "Produk" ? (item.stock || 0) : 0,
        }))
      ),
    })
      .then(() => syncProductsFromDatabase())
      .catch(() => {});
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

    // Sync update ke PostgreSQL via API M4 jika UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedItem.id)) {
      fetch(`/api/m4/v1/products/${updatedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
        body: JSON.stringify({
          name: updatedItem.name,
          description: updatedItem.description,
          type: updatedItem.category === "Produk" ? "PRODUCT" : "SERVICE",
          price: parseFloat(updatedItem.price) || 0,
          unit: updatedItem.unit,
          stock: updatedItem.stock,
          is_active: updatedItem.status === "Aktif",
        }),
      }).catch(() => {});
    }
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

    // Sync delete ke PostgreSQL via API M4 jika UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      fetch(`/api/m4/v1/products/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: DEV_AUTH_HEADER },
      }).catch(() => {});
    }
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

export function parseProductCsvContent(text: string): { items: Omit<ProductItem, "id" | "createdAt">[]; error: string | null } {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return { items: [], error: "Berkas CSV kosong. Pastikan berkas memiliki baris data katalog." };
  const dataLines = /nama|sku|kategori/i.test(lines[0]) ? lines.slice(1) : lines;
  if (dataLines.length === 0) return { items: [], error: "Berkas CSV tidak memiliki baris data selain baris judul/header." };
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
