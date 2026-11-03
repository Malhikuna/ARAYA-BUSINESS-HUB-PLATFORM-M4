import { Customer } from "@/types/customer";

export const initialCustomers: Customer[] = [
  { id: "CUST-001", name: "PT Maju Bersama", initials: "MB", avatarBg: "bg-blue-100 text-blue-700", phone: "0812 3456 7890", email: "kontak@majubersama.co.id", address: "Jl. Asia Afrika No. 45, Bandung", city: "Bandung" },
  { id: "CUST-002", name: "CV Karya Mandiri", initials: "KM", avatarBg: "bg-cyan-100 text-cyan-700", phone: "0813 2211 0045", email: "halo@karyamandiri.com", address: "Jl. Pemuda No. 12, Surabaya", city: "Surabaya" },
  { id: "CUST-003", name: "Budi Santoso", initials: "BS", avatarBg: "bg-amber-100 text-amber-700", phone: "0857 6001 2233", email: "budi.santoso@gmail.com", address: "Jl. Sudirman No. 88, Jakarta Selatan", city: "Jakarta" },
  { id: "CUST-004", name: "PT Mega Logistik Nusantara", initials: "ML", avatarBg: "bg-purple-100 text-purple-700", phone: "0811 9876 5432", email: "admin@megalogistik.co.id", address: "Jl. Gajah Mada No. 102, Semarang", city: "Semarang" },
  { id: "CUST-005", name: "CV Sukses Berkah", initials: "SB", avatarBg: "bg-indigo-100 text-indigo-700", phone: "0821 4455 6677", email: "info@suksesberkah.id", address: "Jl. Malioboro No. 15, Yogyakarta", city: "Yogyakarta" },
  { id: "CUST-006", name: "PT Pasundan Citra Digital", initials: "PC", avatarBg: "bg-emerald-100 text-emerald-700", phone: "0812 7788 9900", email: "corp@pasundancitra.co.id", address: "Jl. Tamansari No. 6-8, Bandung", city: "Bandung" },
  { id: "CUST-007", name: "Yayasan Harapan Bangsa", initials: "YH", avatarBg: "bg-rose-100 text-rose-700", phone: "0819 1234 5678", email: "yayasan@harapanbangsa.org", address: "Jl. Diponegoro No. 22, Bandung", city: "Bandung" },
  { id: "CUST-008", name: "Dr. Ahmad Hidayat", initials: "AH", avatarBg: "bg-teal-100 text-teal-700", phone: "0852 3344 5566", email: "ahmad.hidayat@unpas.ac.id", address: "Jl. Setiabudi No. 193, Bandung", city: "Bandung" },
  { id: "CUST-009", name: "PT Inti Sarana Niaga", initials: "IS", avatarBg: "bg-sky-100 text-sky-700", phone: "0813 9988 7766", email: "sales@intisarana.com", address: "Jl. Gatot Subroto Kav. 51, Jakarta", city: "Jakarta" },
  { id: "CUST-010", name: "Koperasi Pegawai Pasundan", initials: "KP", avatarBg: "bg-orange-100 text-orange-700", phone: "0878 1122 3344", email: "kopeg@pasundan.ac.id", address: "Jl. Lengkong Besar No. 68, Bandung", city: "Bandung" },
  { id: "CUST-011", name: "CV Bandung Kreatif Solusi", initials: "BK", avatarBg: "bg-blue-100 text-blue-700", phone: "0812 9012 3456", email: "hi@bdgkreatif.id", address: "Jl. Riau No. 120, Bandung", city: "Bandung" },
  { id: "CUST-012", name: "PT Global Cipta Inovasi", initials: "GC", avatarBg: "bg-cyan-100 text-cyan-700", phone: "0821 8899 0011", email: "contact@globalcipta.com", address: "Jl. Ir. H. Djuanda No. 85, Bandung", city: "Bandung" },
  { id: "CUST-013", name: "Hendra Gunawan", initials: "HG", avatarBg: "bg-amber-100 text-amber-700", phone: "0856 7788 1122", email: "hendra.gunawan@gmail.com", address: "Jl. Soekarno Hatta No. 405, Bandung", city: "Bandung" },
  { id: "CUST-014", name: "PT Prima Rekayasa Energi", initials: "PR", avatarBg: "bg-purple-100 text-purple-700", phone: "0811 2233 4455", email: "info@primarekayasa.co.id", address: "Jl. Buah Batu No. 210, Bandung", city: "Bandung" },
  { id: "CUST-015", name: "Siti Nurhaliza", initials: "SN", avatarBg: "bg-indigo-100 text-indigo-700", phone: "0819 5566 7788", email: "siti.nurhaliza@yahoo.com", address: "Jl. Cihampelas No. 150, Bandung", city: "Bandung" },
  { id: "CUST-016", name: "CV Berkah Jaya Mandiri", initials: "BJ", avatarBg: "bg-emerald-100 text-emerald-700", phone: "0813 4455 6677", email: "berkahjaya@gmail.com", address: "Jl. Peta No. 90, Bandung", city: "Bandung" },
  { id: "CUST-017", name: "PT Sinar Abadi Perkasa", initials: "SA", avatarBg: "bg-teal-100 text-teal-700", phone: "0852 1122 3344", email: "corp@sinarabadi.co.id", address: "Jl. Laswi No. 34, Bandung", city: "Bandung" },
  { id: "CUST-018", name: "Eko Prasetyo", initials: "EP", avatarBg: "bg-sky-100 text-sky-700", phone: "0877 6655 4433", email: "eko.prasetyo@outlook.com", address: "Jl. Kopo No. 178, Bandung", city: "Bandung" },
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

export function detectCityFromAddress(address: string, fallback = "Bandung"): string {
  const lower = address.toLowerCase();
  if (lower.includes("jakarta")) return "Jakarta";
  if (lower.includes("surabaya")) return "Surabaya";
  if (lower.includes("semarang")) return "Semarang";
  if (lower.includes("yogyakarta") || lower.includes("jogja")) return "Yogyakarta";
  if (lower.includes("bandung")) return "Bandung";
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

export function saveNewCustomerToStorage(newCust: Customer) {
  try {
    const raw = sessionStorage.getItem("araya_added_customers");
    const existing: Customer[] = raw ? JSON.parse(raw) : [];
    const updated = [newCust, ...existing.filter((c) => c.name !== newCust.name)];
    sessionStorage.setItem("araya_added_customers", JSON.stringify(updated));
    sessionStorage.setItem("araya_show_toast", "created");
    sessionStorage.setItem("araya_toast_name", newCust.name);
    window.dispatchEvent(new Event("araya-storage-update"));
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
  } catch {
    // ignore storage errors
  }
}
