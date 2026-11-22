import { ProductCategory, ProductItem, BusinessMode } from "@/types/product";

export const initialProducts: ProductItem[] = [
  { id: "ITEM-001", sku: "SRV-202611-8209", name: "Jasa Service Komputer", category: "Jasa", price: "300000.00", description: "Service komputer sampai bersih", status: "Aktif", unit: "Paket", createdAt: "2026-11-18T17:18:36.520Z" },
  { id: "ITEM-002", sku: "SRV-WEB-004", name: "Jasa Pembuatan Website Korporat", category: "Jasa", price: "3200000.00", description: "Pengembangan website profil perusahaan responsif dengan optimasi SEO dan panel CMS.", status: "Aktif", unit: "Paket", createdAt: "2026-11-09T09:00:00.000Z" },
  { id: "ITEM-003", sku: "SRV-AUDT-003", name: "Jasa Audit Sistem & Keamanan IT", category: "Jasa", price: "4500000.00", description: "Evaluasi keamanan jaringan, penetration testing aplikasi, dan tata kelola infrastruktur IT.", status: "Aktif", unit: "Paket", createdAt: "2026-11-08T09:00:00.000Z" },
  { id: "ITEM-004", sku: "SRV-DSGN-002", name: "Jasa Desain Logo", category: "Jasa", price: "750000.00", description: "Pembuatan konsep identitas visual dan panduan warna brand perusahaan.", status: "Aktif", unit: "Paket", createdAt: "2026-11-06T18:29:06.640Z" },
  { id: "ITEM-005", sku: "SRV-CONS-001", name: "Paket Konsultasi Bisnis", category: "Jasa", price: "1500000.00", description: "Sesi evaluasi strategi usaha dan pendampingan manajemen keuangan per jam.", status: "Nonaktif", unit: "Jam", createdAt: "2026-11-06T18:29:06.627Z" },
  { id: "ITEM-006", sku: "PRD-RTR-005", name: "Router Gigabit Dual-WAN", category: "Produk", price: "3150000.00", description: "Perangkat manajemen jaringan kantor dengan fitur load balancing dan proteksi firewall.", status: "Aktif", stock: 5, unit: "Unit", createdAt: "2026-11-10T10:00:00.000Z" },
  { id: "ITEM-007", sku: "PRD-PRN-004", name: "Printer LaserJet Multifungsi", category: "Produk", price: "5400000.00", description: "Printer laser jaringan untuk cetak, pindai, dan salin dokumen operasional berkecepatan tinggi.", status: "Aktif", stock: 8, unit: "Unit", createdAt: "2026-11-09T10:00:00.000Z" },
  { id: "ITEM-008", sku: "PRD-MON-003", name: "Monitor IPS 27 Inci 4K", category: "Produk", price: "4250000.00", description: "Layar monitor resolusi Ultra HD 4K dengan akurasi warna sRGB 99% untuk desain dan kantor.", status: "Aktif", stock: 12, unit: "Unit", createdAt: "2026-11-08T10:00:00.000Z" },
  { id: "ITEM-009", sku: "PRD-SRV-002", name: "Server Rack Mount 1U", category: "Produk", price: "16500000.00", description: "Unit rak server enterprise untuk penyimpanan database internal perusahaan.", status: "Aktif", stock: 4, unit: "Unit", createdAt: "2026-11-07T17:16:23.085Z" },
  { id: "ITEM-010", sku: "PRD-LPT-001", name: "Laptop Kantor 14 Inci", category: "Produk", price: "8900000.00", description: "Perangkat kerja Intel Core i5, RAM 16 GB, SSD 512 GB dengan garansi resmi.", status: "Aktif", stock: 15, unit: "Unit", createdAt: "2026-11-07T17:16:23.070Z" },
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

    const dbItems: ProductItem[] = json.data
      .map((row: {
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
      (loc) =>
        loc.id.startsWith("ITEM-") &&
        !dbItems.some((db) => db.id === loc.id || db.sku === loc.sku || db.name.toLowerCase() === loc.name.toLowerCase())
    );
    const merged = [...unsyncedLocal, ...dbItems].sort((a, b) => {
      const rawA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const rawB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = Number.isFinite(rawA) ? rawA : 0;
      const timeB = Number.isFinite(rawB) ? rawB : 0;
      return timeB - timeA;
    });

    sessionStorage.setItem("araya_added_products", JSON.stringify(merged));
    window.dispatchEvent(new Event("araya-product-storage-update"));
    return merged;
  } catch {
    return [];
  }
}

export function saveNewProductToStorage(newItem: ProductItem): void {
  try {
    const itemWithTimestamp: ProductItem = { ...newItem, createdAt: newItem.createdAt || new Date().toISOString() };
    const raw = sessionStorage.getItem("araya_added_products");
    const existing: ProductItem[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem("araya_added_products", JSON.stringify([itemWithTimestamp, ...existing]));
    sessionStorage.setItem("araya_product_toast", "created");
    sessionStorage.setItem("araya_product_toast_name", newItem.name);
    sessionStorage.setItem("araya_product_toast_category", newItem.category);
    window.dispatchEvent(new Event("araya-product-storage-update"));

    const payload = {
      ...(newItem.category === "Produk" ? { sku: newItem.sku } : {}),
      name: newItem.name,
      description: newItem.description,
      type: newItem.category === "Produk" ? "PRODUCT" : "SERVICE",
      price: parseFloat(newItem.price) || 0,
      unit: newItem.unit || "pcs",
      stock: newItem.category === "Produk" ? (newItem.stock || 0) : 0,
      is_active: newItem.status === "Aktif",
    };

    // Sync ke PostgreSQL via API M4
    fetch("/api/m4/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.status === 409 && newItem.category === "Produk") {
          await fetch("/api/m4/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
            body: JSON.stringify({ ...payload, sku: `${newItem.sku}-${String(Date.now()).slice(-3)}` }),
          });
        }
        return syncProductsFromDatabase();
      })
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
