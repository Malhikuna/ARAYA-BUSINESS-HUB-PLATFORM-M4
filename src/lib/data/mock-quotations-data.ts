import { Quotation } from "@/types/quotation";

/**
 * 2 Data Awal Penawaran Resmi (Quotation) untuk testing alur end-to-end:
 * - PNW-0005 ↔ PMT-0005: Terkirim (PENDING_APPROVAL)
 * - PNW-0004 ↔ PMT-0004: Disetujui (APPROVED)
 * 8 permintaan lainnya berstatus "Baru" di halaman Permintaan (belum punya penawaran)
 * agar siap diuji alur "Buat penawaran" -> tersimpan sebagai Draf (BR-06, BR-13, BR-14).
 */
export const initialQuotations: Quotation[] = [
  // 1. PNW-0005 -> Terkirim (PMT-0005)
  {
    id: "QUO-005",
    quotation_number: "PNW-0005",
    customer_id: "CUST-001",
    customer_name: "PT Maju Bersama",
    customer_phone: "0812 3456 7890",
    customer_email: "kontak@majubersama.co.id",
    customer_address: "Jl. Asia Afrika No. 45, Bandung",
    quotation_date: "2026-10-28",
    valid_until: "2026-11-11",
    status: "PENDING_APPROVAL",
    permintaan_id: "PMT-0005",
    permintaan_title: "Konsultasi pajak & audit",
    updated_at: "2026-10-28T11:00:00.000Z",
    subtotal: 3750000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 3750000,
    notes: "Review SPT tahunan dan rekonsiliasi PPN badan.",
    items: [
      {
        id: "QI-005-1",
        product_service_id: "SRV-TAX-01",
        name: "Konsultasi Pajak Badan",
        quantity: 1,
        unit_price: 3750000,
        subtotal: 3750000,
        unit: "Paket",
        category: "Jasa",
      },
    ],
  },
  // 2. PNW-0004 -> Disetujui (PMT-0004)
  {
    id: "QUO-004",
    quotation_number: "PNW-0004",
    customer_id: "CUST-002",
    customer_name: "CV Karya Mandiri",
    customer_phone: "0813 2211 0045",
    customer_email: "halo@karyamandiri.com",
    customer_address: "Jl. Pemuda No. 12, Surabaya",
    quotation_date: "2026-10-26",
    valid_until: "2026-11-09",
    status: "APPROVED",
    permintaan_id: "PMT-0004",
    permintaan_title: "Redesain identitas brand dan pedoman warna logo baru",
    updated_at: "2026-10-26T17:30:00.000Z",
    subtotal: 1500000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 1500000,
    notes: "Redesain identitas brand dan pedoman warna logo baru.",
    items: [
      {
        id: "QI-004-1",
        product_service_id: "SRV-DSGN-002",
        name: "Jasa desain logo",
        quantity: 1,
        unit_price: 1500000,
        subtotal: 1500000,
        unit: "Paket",
        category: "Jasa",
      },
    ],
  },
];
