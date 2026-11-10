import { Customer } from "@/types/customer";

export const initialCustomers: Customer[] = [
  { id: "CUST-001", name: "PT Maju Bersama", initials: "MB", avatarBg: "bg-blue-100 text-blue-700", phone: "081234567890", email: "procurement@majubersama.co.id", address: "Jl. Asia Afrika No. 120, Bandung, Jawa Barat", city: "Bandung" },
  { id: "CUST-002", name: "CV Karya Mandiri", initials: "KM", avatarBg: "bg-cyan-100 text-cyan-700", phone: "081398765432", email: "finance@karyamandiri.com", address: "Jl. Dago No. 45, Bandung, Jawa Barat", city: "Bandung" },
  { id: "CUST-003", name: "Dudi Santoso", initials: "DS", avatarBg: "bg-amber-100 text-amber-700", phone: "081711223344", email: "dudi.santoso@gmail.com", address: "Jl. Buah Batu No. 88, Bandung, Jawa Barat", city: "Bandung" },
];

export function getCustomerInitials(name: string, singleWordLength = 2): string {
  const trimmed = name.trim();
  if (!trimmed) return "P";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, singleWordLength).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

const KNOWN_CITIES = [
  "Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta", "Medan", "Padang", "Palembang",
  "Makassar", "Denpasar", "Malang", "Solo", "Bogor", "Depok", "Tangerang", "Bekasi", "Batam",
  "Pekanbaru", "Bandar Lampung", "Samarinda", "Balikpapan", "Banjarmasin", "Pontianak", "Manado", "Cimahi", "Cirebon"
];

export function detectCityFromAddress(address: string, fallback = "Bandung"): string {
  if (!address || typeof address !== "string") return fallback;
  const lower = address.toLowerCase();

  const kotaMatch = address.match(/(?:kota|kabupaten|kab\.)\s+([a-zA-Z\s]+?)(?:,|$|\d)/i);
  if (kotaMatch?.[1] && kotaMatch[1].trim().length >= 3 && kotaMatch[1].trim().length <= 25) {
    const raw = kotaMatch[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  const found = KNOWN_CITIES.find((c) => lower.includes(c.toLowerCase()));
  if (found) return found;

  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[1].replace(/^(kota|kabupaten|kab\.)\s+/i, "").trim();
    if (candidate && candidate.length <= 25 && !/\d{4,}/.test(candidate)) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  return fallback;
}

export function findCustomerById(id: string): Customer | null {
  if (!id) return null;

  if (typeof window !== "undefined") {
    try {
      const deletedRaw = sessionStorage.getItem("araya_deleted_customers");
      if (deletedRaw && (JSON.parse(deletedRaw) as string[]).includes(id)) {
        return null;
      }
      const updatedRaw = sessionStorage.getItem("araya_updated_customers");
      if (updatedRaw) {
        const updatedMap: Record<string, Customer> = JSON.parse(updatedRaw);
        if (updatedMap[id]) return updatedMap[id];
      }
      const addedRaw = sessionStorage.getItem("araya_added_customers");
      if (addedRaw) {
        const addedList: Customer[] = JSON.parse(addedRaw);
        const found = addedList.find((c) => c.id === id);
        if (found) return found;
      }
    } catch {
      // ignore storage errors
    }
  }

  return initialCustomers.find((c) => c.id === id) || null;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-cyan-100 text-cyan-700", "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700",
];

export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("62") ? "0" + digits.slice(2) : digits;
}

export function checkCustomerDuplicates(
  email: string,
  phone: string,
  excludeId?: string
): { email?: string; phone?: string } {
  if (typeof window === "undefined") return {};
  try {
    const rawAdded = sessionStorage.getItem("araya_added_customers");
    const addedList: Customer[] = rawAdded ? JSON.parse(rawAdded) : [];
    const rawUpdates = sessionStorage.getItem("araya_updated_customers");
    const updatesMap: Record<string, Customer> = rawUpdates ? JSON.parse(rawUpdates) : {};
    const rawDel = sessionStorage.getItem("araya_deleted_customers");
    const deletedList: string[] = rawDel ? JSON.parse(rawDel) : [];

    const all = [...addedList, ...initialCustomers.filter((c) => !addedList.some((a) => a.id === c.id))]
      .filter((c) => !deletedList.includes(c.id))
      .map((c) => updatesMap[c.id] || c);

    const normEmail = email.trim().toLowerCase();
    const normPhone = normalizePhoneDigits(phone);
    const errors: { email?: string; phone?: string } = {};

    for (const c of all) {
      if (excludeId && (c.id === excludeId || c.id === `CUST-${excludeId}` || excludeId.includes(c.id))) continue;
      if (normEmail && c.email && c.email.trim().toLowerCase() === normEmail) {
        errors.email = "Alamat email sudah terdaftar untuk pelanggan lain.";
      }
      if (normPhone && c.phone && normalizePhoneDigits(c.phone) === normPhone) {
        errors.phone = "Nomor telepon/WhatsApp sudah terdaftar untuk pelanggan lain.";
      }
    }
    return errors;
  } catch {
    return {};
  }
}

export function getCustomerAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function subscribeCustomerStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("araya-storage-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-storage-update", callback);
  };
}

export const getStoredCustomers = () =>
  typeof window === "undefined" ? "[]" : sessionStorage.getItem("araya_added_customers") || "[]";
export const getServerStoredCustomers = () => "[]";

export const getStoredCustomerUpdates = () =>
  typeof window === "undefined" ? "{}" : sessionStorage.getItem("araya_updated_customers") || "{}";
export const getServerStoredCustomerUpdates = () => "{}";

export const getStoredDeletedCustomers = () =>
  typeof window === "undefined" ? "[]" : sessionStorage.getItem("araya_deleted_customers") || "[]";
export const getServerStoredDeletedCustomers = () => "[]";

const DEV_AUTH_HEADER = "Bearer mock-admin-token";

export async function syncCustomersFromDatabase(): Promise<Customer[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/m4/v1/customers?limit=100", {
      headers: { Authorization: DEV_AUTH_HEADER },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];

    const dbItems: Customer[] = json.data.map((row: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address?: string | null;
      created_at?: string;
    }) => ({
      id: row.id,
      name: row.name,
      initials: getCustomerInitials(row.name),
      avatarBg: getCustomerAvatarBg(row.name),
      phone: row.phone,
      email: row.email,
      address: row.address || "",
      city: detectCityFromAddress(row.address || ""),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const rawLocal = sessionStorage.getItem("araya_added_customers");
    const localItems: Customer[] = rawLocal ? JSON.parse(rawLocal) : [];
    const unsyncedLocal = localItems.filter(
      (loc) =>
        !dbItems.some(
          (db) =>
            db.id === loc.id ||
            db.email.toLowerCase() === loc.email.toLowerCase() ||
            db.name.toLowerCase() === loc.name.toLowerCase()
        )
    );
    const merged = [...unsyncedLocal, ...dbItems];

    sessionStorage.setItem("araya_added_customers", JSON.stringify(merged));
    window.dispatchEvent(new Event("araya-storage-update"));
    return merged;
  } catch {
    return [];
  }
}

export function saveNewCustomerToStorage(newCust: Customer) {
  try {
    const raw = sessionStorage.getItem("araya_added_customers");
    const existing: Customer[] = raw ? JSON.parse(raw) : [];
    const updated = [newCust, ...existing.filter((c) => c.name !== newCust.name)];
    sessionStorage.setItem("araya_added_customers", JSON.stringify(updated));
    sessionStorage.setItem("araya_show_toast", "created");
    sessionStorage.setItem("araya_toast_name", newCust.name);
    window.dispatchEvent(new Event("araya-storage-update"));

    // Sync ke PostgreSQL via API M4
    fetch("/api/m4/v1/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify({
        name: newCust.name,
        email: newCust.email,
        phone: newCust.phone,
        address: newCust.address,
      }),
    })
      .then(() => syncCustomersFromDatabase())
      .catch(() => {});
  } catch {
    // ignore storage errors
  }
}

export function saveUpdatedCustomerToStorage(updatedCustomer: Customer) {
  try {
    const rawUpdates = sessionStorage.getItem("araya_updated_customers");
    const updatesMap: Record<string, Customer> = rawUpdates ? JSON.parse(rawUpdates) : {};
    updatesMap[updatedCustomer.id] = updatedCustomer;
    sessionStorage.setItem("araya_updated_customers", JSON.stringify(updatesMap));

    const rawAdded = sessionStorage.getItem("araya_added_customers");
    if (rawAdded) {
      const addedList: Customer[] = JSON.parse(rawAdded);
      sessionStorage.setItem(
        "araya_added_customers",
        JSON.stringify(addedList.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))
      );
    }

    sessionStorage.setItem("araya_show_toast", "updated");
    sessionStorage.setItem("araya_toast_name", updatedCustomer.name);
    window.dispatchEvent(new Event("araya-storage-update"));

    // Sync ke PostgreSQL via API M4 jika UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedCustomer.id)) {
      fetch(`/api/m4/v1/customers/${updatedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
        body: JSON.stringify({
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          address: updatedCustomer.address,
        }),
      }).catch(() => {});
    }
  } catch {
    // ignore storage errors
  }
}

export function deleteCustomerFromStorage(targetId: string) {
  try {
    const rawDel = sessionStorage.getItem("araya_deleted_customers");
    const deletedList: string[] = rawDel ? JSON.parse(rawDel) : [];
    if (!deletedList.includes(targetId)) {
      sessionStorage.setItem("araya_deleted_customers", JSON.stringify([...deletedList, targetId]));
    }

    const rawAdded = sessionStorage.getItem("araya_added_customers");
    if (rawAdded) {
      const addedList: Customer[] = JSON.parse(rawAdded);
      sessionStorage.setItem(
        "araya_added_customers",
        JSON.stringify(addedList.filter((c) => c.id !== targetId))
      );
    }

    window.dispatchEvent(new Event("araya-storage-update"));

    // Sync delete ke PostgreSQL via API M4 jika UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      fetch(`/api/m4/v1/customers/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: DEV_AUTH_HEADER },
      }).catch(() => {});
    }
  } catch {
    // ignore storage errors
  }
}
