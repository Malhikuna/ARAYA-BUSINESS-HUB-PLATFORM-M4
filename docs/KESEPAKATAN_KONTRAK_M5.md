# Lembar Kesepakatan Kontrak Integrasi Order (M5 ke M4)
## Araya Business Hub — Modul 4 (Sales & Invoicing) & Modul 5 (Website & Katalog)

- **Target Story:** M5-US4 (Checkout Keranjang Belanja) & M4-US3 (Penerimaan Checkout)
- **Status Kontrak:** Draft v0.1 — Siap Disepakati dengan Kelompok A5
- **Tanggal:** 1 November 2026
- **Spesifikasi Teknis:** [`docs/openapi_m5_order_contract.yaml`](openapi_m5_order_contract.yaml)

---

## 1. Poin-Poin Kesepakatan Utama

1. **Otoritas Harga & Pajak (*Price Authority*):**
   - Modul 4 adalah sumber kebenaran tunggal (*single source of truth*) atas harga dan tarif pajak (PPN 11%).
   - Modul 5 mengirimkan `unit_price_displayed` murni untuk rekonsiliasi. Jika harga di web M5 berbeda dengan harga master M4 saat tombol checkout ditekan, Modul 4 akan menolak dengan error `409 PRICE_CHANGED` dan mengembalikan harga terbaru.
2. **Aturan Satu Keranjang Satu Mitra (No Mixed-Partner Cart):**
   - Untuk MVP/Sprint 1 & 2, satu transaksi checkout hanya diperbolehkan berisi produk dari **satu mitra (`partner_id`) yang sama**.
   - Jika keranjang belanja customer di M5 berisi produk dari beberapa mitra berbeda, Modul 5 **wajib memecah keranjang (*split cart*)** sebelum memanggil API Modul 4. Jika digabung, M4 akan mengembalikan status `422 MIXED_PARTNER_CART`.
3. **Status Awal Order:**
   - Sesuai dengan arahan Product Owner, status awal pemrosesan Order setelah checkout berhasil adalah **`Baru`** (dengan status pembayaran `PENDING_PAYMENT`).
   - Partner dapat memperbarui statusnya menjadi `Diproses` dan `Selesai` (M4-US4).
4. **Idempotensi Transaksi:**
   - Modul 5 **wajib menyertakan header `Idempotency-Key: <UUID>`**.
   - Jika terjadi kendala jaringan dan permintaan checkout dikirim ulang dengan key yang sama, Modul 4 menjamin tidak ada order ganda yang dibuat dan mengembalikan data order yang identik.
5. **Autentikasi & Identitas Customer:**
   - Modul 5 menyertakan header `Authorization: Bearer <JWT>` yang diterbitkan Modul 1.
   - Nilai `customer.user_id` pada body request wajib identik dengan klaim `sub` pada token JWT.

---

## 2. Contoh Payload Komunikasi

### 2.1 Request dari Modul 5 (Checkout)
```http
POST /api/v1/checkouts
Authorization: Bearer <JWT_CUSTOMER>
Idempotency-Key: 6f1c2b8e-3f0a-4a53-9c1d-7a2b5d9e1f10
Content-Type: application/json
```
```json
{
  "source": {
    "module": "M5",
    "cart_id": "cart_01J9ZQ7K3M",
    "checkout_requested_at": "2026-10-07T09:15:30Z"
  },
  "customer": {
    "user_id": "usr_01J9ZP2A8C",
    "full_name": "Budi Santoso",
    "email": "budi@example.com",
    "phone": "+6281234567890",
    "billing_address": {
      "line1": "Jl. Dipati Ukur No. 10",
      "city": "Bandung",
      "province": "Jawa Barat",
      "postal_code": "40132",
      "country": "ID"
    }
  },
  "partner_id": "ptr_01J9ZN5R1D",
  "business_unit_id": "bu_01J9ZM3T9E",
  "currency": "IDR",
  "items": [
    {
      "product_id": "prd_01J9ZK8W2F",
      "sku": "KAOS-UNPAS-M",
      "name": "Kaos Unpas Size M",
      "quantity": 2,
      "unit_price_displayed": "75000.00"
    },
    {
      "product_id": "prd_01J9ZK9X4G",
      "sku": "JASA-CETAK-A3",
      "name": "Jasa Cetak A3",
      "quantity": 1,
      "unit_price_displayed": "25000.00"
    }
  ],
  "notes": "Mohon dikemas rapi"
}
```

### 2.2 Response dari Modul 4 (HTTP 201 Created)
```json
{
  "checkout_id": "chk_01J9ZR4B7H",
  "order": {
    "id": "ord_01J9ZR4B8J",
    "order_number": "ORD-202610-0001",
    "status": "Baru",
    "payment_status": "PENDING_PAYMENT",
    "source_cart_id": "cart_01J9ZQ7K3M",
    "partner_id": "ptr_01J9ZN5R1D",
    "business_unit_id": "bu_01J9ZM3T9E",
    "items": [
      {
        "product_id": "prd_01J9ZK8W2F",
        "name": "Kaos Unpas Size M",
        "quantity": 2,
        "unit_price": "75000.00",
        "tax_rate": "0.1100",
        "line_net": "150000.00",
        "line_tax": "16500.00",
        "line_total": "166500.00"
      },
      {
        "product_id": "prd_01J9ZK9X4G",
        "name": "Jasa Cetak A3",
        "quantity": 1,
        "unit_price": "25000.00",
        "tax_rate": "0.1100",
        "line_net": "25000.00",
        "line_tax": "2750.00",
        "line_total": "27750.00"
      }
    ],
    "subtotal": "175000.00",
    "discount_total": "0.00",
    "tax_total": "19250.00",
    "grand_total": "194250.00",
    "currency": "IDR",
    "created_at": "2026-10-07T09:15:31Z"
  },
  "invoice": {
    "id": "inv_01J9ZR4B9K",
    "invoice_number": "INV-202610-0001",
    "status": "ISSUED",
    "issue_date": "2026-10-07",
    "due_date": "2026-10-09",
    "grand_total": "194250.00",
    "pay_url": "/api/v1/invoices/inv_01J9ZR4B9K/payments"
  }
}
```

---

## 3. Tanda Tangan & Persetujuan

| Pihak | Perwakilan | Status |
|---|---|:---:|
| **Kel. A4 (Modul 4 — Sales & Invoicing)** | Tim Backend M4 | ✅ *Diajukan* |
| **Kel. A5 (Modul 5 — Website & Katalog)** | Tim Backend M5 | ⏳ *Menunggu Review & Konfirmasi* |
