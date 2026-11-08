import { Quotation, QuotationStatus } from "@/types/quotation";

export const initialQuotations: Quotation[] = [
  {
    id: "QUO-005",
    quotation_number: "PNW-0005",
    customer_id: "CUST-001",
    customer_name: "PT Maju Bersama",
    customer_phone: "081234567890",
    customer_email: "procurement@majubersama.co.id",
    customer_address: "Jl. Asia Afrika No. 120, Bandung, Jawa Barat",
    quotation_date: "2026-10-28",
    valid_until: "2026-11-11",
    status: "PENDING_APPROVAL",
    subtotal: 3750000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 3750000,
    notes: "Harga belum termasuk bea materai fisik jika diperlukan legalitas basah.",
    items: [
      {
        id: "QI-001",
        product_service_id: "ITEM-001",
        name: "Paket konsultasi bisnis",
        quantity: 2,
        unit_price: 1500000,
        subtotal: 3000000,
        unit: "Jam",
        category: "Jasa",
      },
      {
        id: "QI-002",
        product_service_id: "ITEM-002",
        name: "Jasa desain logo",
        quantity: 1,
        unit_price: 750000,
        subtotal: 750000,
        unit: "Paket",
        category: "Jasa",
      },
    ],
    createdAt: "2026-10-28T09:00:00.000Z",
  },
  {
    id: "QUO-004",
    quotation_number: "PNW-0004",
    customer_id: "CUST-002",
    customer_name: "CV Karya Mandiri",
    customer_phone: "081398765432",
    customer_email: "finance@karyamandiri.com",
    customer_address: "Jl. Dago No. 45, Bandung, Jawa Barat",
    quotation_date: "2026-10-26",
    valid_until: "2026-11-09",
    status: "APPROVED",
    subtotal: 8900000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 8900000,
    notes: "Garansi resmi distributor 1 tahun untuk unit laptop.",
    items: [
      {
        id: "QI-003",
        product_service_id: "ITEM-003",
        name: "Laptop kantor 14 inci",
        quantity: 1,
        unit_price: 8900000,
        subtotal: 8900000,
        unit: "Unit",
        category: "Produk",
      },
    ],
    createdAt: "2026-10-26T10:30:00.000Z",
  },
  {
    id: "QUO-003",
    quotation_number: "PNW-0003",
    customer_id: "CUST-003",
    customer_name: "Budi Santoso",
    customer_phone: "081711223344",
    customer_email: "dudi.santoso@gmail.com",
    customer_address: "Jl. Buah Batu No. 88, Bandung, Jawa Barat",
    quotation_date: "2026-10-24",
    valid_until: "2026-11-07",
    status: "APPROVED",
    subtotal: 750000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 750000,
    notes: "Termasuk 2 kali revisi minor desain logo.",
    items: [
      {
        id: "QI-004",
        product_service_id: "ITEM-002",
        name: "Jasa desain logo",
        quantity: 1,
        unit_price: 750000,
        subtotal: 750000,
        unit: "Paket",
        category: "Jasa",
      },
    ],
    createdAt: "2026-10-24T14:15:00.000Z",
  },
  {
    id: "QUO-002",
    quotation_number: "PNW-0002",
    customer_id: "CUST-001",
    customer_name: "PT Maju Bersama",
    customer_phone: "081234567890",
    customer_email: "procurement@majubersama.co.id",
    customer_address: "Jl. Asia Afrika No. 120, Bandung, Jawa Barat",
    quotation_date: "2026-10-20",
    valid_until: "2026-11-03",
    status: "PENDING_APPROVAL",
    subtotal: 1500000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 1500000,
    notes: "Sesi evaluasi finansial dan operasional awal.",
    items: [
      {
        id: "QI-005",
        product_service_id: "ITEM-001",
        name: "Paket konsultasi bisnis",
        quantity: 1,
        unit_price: 1500000,
        subtotal: 1500000,
        unit: "Jam",
        category: "Jasa",
      },
    ],
    createdAt: "2026-10-20T11:00:00.000Z",
  },
  {
    id: "QUO-001",
    quotation_number: "PNW-0001",
    customer_id: "CUST-002",
    customer_name: "CV Karya Mandiri",
    customer_phone: "081398765432",
    customer_email: "finance@karyamandiri.com",
    customer_address: "Jl. Dago No. 45, Bandung, Jawa Barat",
    quotation_date: "2026-10-15",
    valid_until: "2026-10-29",
    status: "APPROVED",
    subtotal: 4250000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 4250000,
    notes: "Pengadaan perangkat kerja penunjang divisi kreatif.",
    items: [
      {
        id: "QI-006",
        product_service_id: "ITEM-001",
        name: "Paket konsultasi bisnis",
        quantity: 2,
        unit_price: 1500000,
        subtotal: 3000000,
        unit: "Jam",
        category: "Jasa",
      },
      {
        id: "QI-007",
        product_service_id: "ITEM-002",
        name: "Jasa desain logo",
        quantity: 1,
        unit_price: 750000,
        subtotal: 750000,
        unit: "Paket",
        category: "Jasa",
      },
    ],
    createdAt: "2026-10-15T08:30:00.000Z",
  },
];

const DEV_AUTH_HEADER = "Bearer mock-admin-token";

export function formatTanggalIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function subscribeQuotationStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("araya-quotation-storage-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("araya-quotation-storage-update", callback);
  };
}

export function getStoredQuotations(): Quotation[] {
  if (typeof window === "undefined") return initialQuotations;
  try {
    const raw = sessionStorage.getItem("araya_added_quotations");
    const addedList: Quotation[] = raw ? JSON.parse(raw) : [];

    const updatedRaw = sessionStorage.getItem("araya_updated_quotations");
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};

    const base = [...addedList, ...initialQuotations.filter((q) => !addedList.some((a) => a.id === q.id || a.quotation_number === q.quotation_number))];
    return base.map((q) => (updatedMap[q.id] ? { ...q, ...updatedMap[q.id] } : q));
  } catch {
    return initialQuotations;
  }
}

export function getServerStoredQuotations(): Quotation[] {
  return initialQuotations;
}

export function findQuotationById(id: string): Quotation | null {
  const all = getStoredQuotations();
  return all.find((q) => q.id === id || q.quotation_number === id) || null;
}

export function saveNewQuotationToStorage(newQuo: Quotation) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem("araya_added_quotations");
    const list: Quotation[] = raw ? JSON.parse(raw) : [];
    const updated = [newQuo, ...list.filter((x) => x.id !== newQuo.id && x.quotation_number !== newQuo.quotation_number)];
    sessionStorage.setItem("araya_added_quotations", JSON.stringify(updated));
    sessionStorage.setItem("araya_show_quotation_toast", "created");
    sessionStorage.setItem("araya_quotation_toast_number", newQuo.quotation_number);
    window.dispatchEvent(new Event("araya-quotation-storage-update"));

    // Sync ke PostgreSQL via API M4
    fetch("/api/m4/v1/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
      body: JSON.stringify({
        customer_id: newQuo.customer_id,
        quotation_date: newQuo.quotation_date,
        valid_until: newQuo.valid_until,
        notes: newQuo.notes,
        items: newQuo.items.map((it) => ({
          product_service_id: it.product_service_id,
          description: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount_amount: 0,
          tax_rate: 0,
        })),
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function approveQuotationInStorage(id: string) {
  if (typeof window === "undefined") return;
  try {
    const updatedRaw = sessionStorage.getItem("araya_updated_quotations");
    const updatedMap: Record<string, Partial<Quotation>> = updatedRaw ? JSON.parse(updatedRaw) : {};
    updatedMap[id] = { ...(updatedMap[id] || {}), status: "APPROVED" as QuotationStatus };
    sessionStorage.setItem("araya_updated_quotations", JSON.stringify(updatedMap));
    sessionStorage.setItem("araya_show_quotation_toast", "approved");
    window.dispatchEvent(new Event("araya-quotation-storage-update"));

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      fetch(`/api/m4/v1/quotations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: DEV_AUTH_HEADER },
        body: JSON.stringify({ status: "APPROVED" }),
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function generateNextQuotationNumber(): string {
  if (typeof window === "undefined") return "PNW-0006";
  const all = getStoredQuotations();
  const maxNum = all.reduce((max, q) => {
    const match = q.quotation_number.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      return n > max ? n : max;
    }
    return max;
  }, 5);
  return `PNW-${String(maxNum + 1).padStart(4, "0")}`;
}
