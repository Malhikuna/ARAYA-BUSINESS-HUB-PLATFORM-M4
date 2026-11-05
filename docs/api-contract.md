# Panduan Integrasi & Kontrak API Bersama (Modul 4)
## Araya Business Hub Platform — Modul 4: Penawaran & Tagihan Penjualan (Sales)

- **Versi Dokumen:** v1.0 (Mengacu pada *Panduan API Bersama v1.0 Draf 28 Okt 2026*)
- **Status:** Wajib dan Berlaku untuk Seluruh Integrasi Antarmodul (M1–M14)
- **Spesifikasi Mesin (OpenAPI):** [`docs/openapi.yaml`](openapi.yaml) & [`docs/openapi.json`](openapi.json)
- **Halaman Dokumentasi Interaktif (Swagger UI):** `/api/m4/v1/docs` dan `/docs`

---

## 1. Alamat dan Penamaan Endpoint

Sesuai aturan bersama, semua alamat endpoint modul memakai pola alamat yang seragam:

$$\text{https://[server-bersama]/api/\{modul\}/v1/\{resource\}}$$

Untuk **Modul 4 (Penjualan)**, seluruh endpoint menggunakan basis URL:
```http
/api/m4/v1/{resource}
```

### Aturan Komponen URL & Payload:
| Bagian | Aturan | Contoh di Modul 4 |
| :--- | :--- | :--- |
| **Kode Modul** | Huruf kecil sesuai nomor modul (`m4`) | `/api/m4/v1/...` |
| **Versi** | Selalu ada, dimulai dari `v1` | `/api/m4/v1/orders` |
| **Resource** | Kata benda jamak (*plural*), bahasa Inggris, huruf kecil dengan tanda hubung (*kebab-case*) | `orders`, `products`, `customers`, `quotations`, `invoices`, `dashboard-summary` |
| **Satu Data** | Resource + ID bilangan bulat | `/api/m4/v1/orders/125`, `/api/m4/v1/products/31` |
| **Aksi Perubahan Status** | `POST` ke resource + nama aksi | `POST /api/m4/v1/quotations/12/convert` |
| **Nama Field JSON** | `snake_case`, bahasa Inggris | `total_amount`, `customer_id`, `product_id`, `order_no`, `is_active` |

---

## 2. Autentikasi dan Hak Akses

1. **Pengguna Memanggil API:**  
   Header: `Authorization: Bearer <token>` (Token JWT resmi diterbitkan oleh Modul 1, berlaku 8 jam).  
   Modul 4 membaca `user_id`, `role`, dan `unit_usaha_id` dari payload token untuk memeriksa hak akses tanpa menembak ulang M1 di setiap request.
   
   **Contoh Isi Token JWT dari M1:**
   ```json
   {
     "user_id": 42,
     "name": "Rani Kusumawati",
     "role": "kasir",
     "division": "penjualan",
     "unit_usaha_id": 3,
     "exp": 1793180400
   }
   ```

2. **Panggilan Antarmodul Tanpa Pengguna (Service-to-Service / Event Bus):**  
   Header: `X-Service-Key: <kunci modul>`  
   Digunakan untuk pengiriman event webhook atau sinkronisasi background job.

3. **Endpoint Publik:**  
   Tanpa header. Ditandai `publik` di OpenAPI (misal: webhook pembayaran Midtrans dan halaman dokumentasi `/docs`).

4. **Penanganan Error Akses:**
   - Token tidak ada, salah, atau kedaluwarsa $\rightarrow$ **HTTP 401** (`code: "UNAUTHENTICATED"`).
   - Token benar tetapi peran tidak berhak $\rightarrow$ **HTTP 403** (`code: "FORBIDDEN"`).

---

## 3. Bentuk Respons dan Kode Status (Amplop Seragam)

Semua respons JSON di Modul 4 wajib menggunakan format amplop standar:

### 3.1 Respons Sukses (Satu Data)
```json
{
  "success": true,
  "data": {
    "id": 125,
    "order_no": "ORD-20261028-0007",
    "status": "baru",
    "total_amount": 185000
  }
}
```

### 3.2 Respons Sukses (Daftar Data & Pagination)
```json
{
  "success": true,
  "data": [
    {
      "id": 31,
      "sku": "KAOS-UNPAS-M",
      "name": "Kaos Unpas Size M",
      "price": 75000,
      "tax_rate": 11,
      "unit": "pcs",
      "is_active": true
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 57,
    "total_pages": 3
  }
}
```

### 3.3 Respons Galat (*Error Envelope*)
```json
{
  "success": false,
  "error": {
    "code": "ITEMS_EMPTY",
    "message": "Keranjang masih kosong",
    "fields": {
      "items": "Daftar item tidak boleh kosong"
    }
  }
}
```
- `code`: `HURUF_BESAR_DENGAN_GARIS_BAWAH` (*SCREAMING_SNAKE_CASE*). Modul lain membaca `code`, bukan message.
- `message`: Bahasa Indonesia dan sama persis dengan teks Acceptance Criteria.
- `fields`: Hanya ada untuk galat validasi (**HTTP 422**). Jika bukan 422, bernilai `null`.

### 3.4 Matriks Kode Status HTTP:
| Kode | Arti | Contoh di Modul 4 |
| :--- | :--- | :--- |
| **200** | Berhasil | Daftar produk/pelanggan tampil, status update |
| **201** | Data baru berhasil dibuat | Order terbentuk dari keranjang, invoice dibuat |
| **400** | Permintaan tidak masuk akal | Konversi quotation yang belum disetujui |
| **401** | Belum login atau token tidak sah | Customer belum login saat checkout (`UNAUTHENTICATED`) |
| **403** | Sudah login, tetapi peran tidak berhak | Role kasir mencoba mengubah konfigurasi pajak |
| **404** | Data tidak ditemukan | ID order atau invoice tidak ada di basis data |
| **409** | Konflik / bertentangan status | Ada produk di keranjang yang sudah tidak aktif |
| **422** | Isian tidak lolos validasi | Items kosong, quantity $\le 0$ |
| **500** | Galat di server | Kegagalan sistem internal |

> [!NOTE]
> Kondisi **"tidak ada data"** bukan galat. Daftar kosong dijawab **HTTP 200** dengan `"data": []`.

---

## 4. Standar Format Data

| Data | Format di API | Contoh |
| :--- | :--- | :--- |
| **Tanggal** | ISO 8601 `YYYY-MM-DD` | `"2026-10-28"` |
| **Tanggal & Jam** | ISO 8601 zona WIB | `"2026-10-28T09:15:00+07:00"` |
| **Bulan (Rekap)** | `YYYY-MM` | `"2026-10"` |
| **Uang** | **Bilangan bulat rupiah, tanpa titik dan tanpa desimal** | `85000`, `185000` |
| **Persen** | Angka 0–100 | `11` (untuk PPN 11%) |
| **ID** | Bilangan bulat dari modul pemilik | `"product_id": 31`, `"customer_id": 17` |
| **Nomor Dokumen** | `PREFIKS-YYYYMMDD-urutan 4 digit` | `"ORD-20261028-0007"`, `"INV-20261028-0001"`, `"QUO-20261028-0001"` |
| **Status** | Huruf kecil, snake_case, bahasa Indonesia | `"baru"`, `"lunas"`, `"belum_lunas"`, `"disetujui"` |
| **Ya/Tidak** | Boolean `true` / `false` | `"is_active": true` |
| **Kosong** | `null` (bukan string kosong `""`) | `"notes": null` |

### Field Rujukan Antarmodul (`{nama_data}_id`):
- `user_id` (M1)
- `unit_usaha_id` (M2)
- `partner_id` (M3)
- `product_id`, `customer_id`, `order_id`, `invoice_id` (M4)
- `sale_id` (M6)
- `supplier_id`, `purchase_order_id` (M10)

---

## 5. Event Antarmodul (Publikasi Keluar Modul 4)

Ketika pesanan online berhasil dibayar melalui webhook Midtrans atau dibatalkan, Modul 4 mempublikasikan event ke modul hilir (khususnya **Modul 9: Manajemen Stok** untuk penyesuaian stok otomatis).

```http
POST /api/m9/v1/events
X-Service-Key: <kunci modul pengirim>
```

**Payload Event:**
```json
{
  "event_id": "6f1c2b9e-0d4a-4f7b-9a51-1e2c3d4f5a6b",
  "event_type": "order.paid",
  "source_module": "M4",
  "occurred_at": "2026-10-28T10:05:12+07:00",
  "recipient_role": null,
  "payload": {
    "order_id": 125,
    "order_no": "ORD-20261028-0007",
    "customer_id": 17,
    "items": [
      { "product_id": 31, "qty": 2 },
      { "product_id": 40, "qty": 1 }
    ],
    "total_amount": 185000
  }
}
```

### Aturan Event:
1. `event_id`: UUID unik. Modul penerima wajib menyimpan dan mengabaikan event ganda (*idempotent deduplication*).
2. `event_type`: Format `data.kejadian` huruf kecil bentuk lampau (`order.paid`, `order.cancelled`).
3. Retry: Jika penerima tidak merespons HTTP 200, pengirim mencoba ulang 3x dengan jeda 1, 5, dan 30 menit.

---

## 6. Daftar Kontrak Resmi Terkait Modul 4

Daftar kontrak resmi yang tercantum pada tabel Bab 6 Panduan Bersama:

| ID | Penyedia $\rightarrow$ Pemakai | Kontrak | Bentuk Endpoint | User Story Terkait |
| :--- | :--- | :--- | :--- | :--- |
| **K-01** | M1 $\rightarrow$ semua | Token login dan profil pengguna | `GET /api/m1/v1/me` | M1-US1 |
| **K-02** | M2 $\rightarrow$ semua | Data unit usaha aktif | `GET /api/m2/v1/business-units` | M2-US1 |
| **K-03** | M4 $\rightarrow$ M2 | Ringkasan penjualan untuk dashboard | `GET /api/m4/v1/dashboard-summary?from&to&unit_usaha_id` | M2-US2, M2-US4 |
| **K-04** | M4 $\rightarrow$ M5 | Membuat Order dari keranjang checkout | `POST /api/m4/v1/orders` | M5-US4 |
| **K-05** | M4 $\rightarrow$ M5, M6 | Data produk/jasa aktif | `GET /api/m4/v1/products` | M4-US1, M5-US1, M6-US1 |
| **K-06** | M3 $\rightarrow$ M5 | Data partner terverifikasi untuk katalog | `GET /api/m3/v1/partners?status=terverifikasi` | M3-US2, M3-US4 |
| **K-09** | M4 $\rightarrow$ M9 | Pesanan online lunas / dibatalkan | `event order.paid`, `order.cancelled` | M9-US1, M9-US2 |

---

## 7. Rincian Kontrak Inti K-04 (Order dari Keranjang M5)

### Permintaan dari Modul 5:
```http
POST /api/m4/v1/orders
Authorization: Bearer <token Customer>
Content-Type: application/json

{
  "customer_id": 17,
  "source": "website",
  "items": [
    { "product_id": 31, "qty": 2 },
    { "product_id": 40, "qty": 1 }
  ]
}
```

### Jawaban Modul 4 (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 125,
    "order_no": "ORD-20261028-0007",
    "status": "baru",
    "total_amount": 185000
  }
}
```

### Kemungkinan Galat:
| Kode HTTP | `error.code` | Kapan Terjadi |
| :--- | :--- | :--- |
| **401** | `UNAUTHENTICATED` | Customer belum login atau token kedaluwarsa |
| **409** | `PRODUCT_INACTIVE` | Terdapat item produk yang sudah dinonaktifkan di master M4 |
| **422** | `ITEMS_EMPTY` | Daftar item keranjang kosong |

---

## 8. Endpoint Internal / Back-Office Modul 4

Selain kontrak antarmodul publik di atas, Modul 4 menyediakan endpoint back-office untuk Admin & Mitra:

1. **`POST /api/m4/v1/quotations` (M4-US2):** Pembuatan surat penawaran harga (*quotation*) resmi.
2. **`POST /api/m4/v1/quotations/{id}/convert` (M4-US2 / PRO-20):** Mengonversi penawaran berstatus `disetujui` menjadi tagihan faktur invoice `belum_lunas`.
3. **`POST /api/m4/v1/invoices/{invoice_id}/payments`:** Customer memulai sesi pembayaran invoice untuk mendapatkan snap token Midtrans Sandbox.
4. **`POST /api/m4/v1/webhooks/payments/midtrans`:** Webhook penerima status settlement dari Midtrans (Verifikasi signature SHA-512).
5. **`GET & POST /api/m4/v1/customers` (M4-US1):** Manajemen data kontak dan alamat faktur pelanggan.
6. **`PATCH /api/m4/v1/orders/{id}/status` (M4-US4):** Memperbarui status siklus pengerjaan pesanan (`baru`, `diproses`, `selesai`, `dibatalkan`).

---

## 9. Daftar Periksa Kepatuhan Integrasi (Bab 8 & Lampiran)

- [x] Semua alamat memakai pola `/api/m4/v1/...`
- [x] Semua endpoint yang butuh login memeriksa token JWT dari M1
- [x] Panggilan antarmodul tanpa pengguna memakai header `X-Service-Key`
- [x] Semua respons memakai amplop seragam `success` / `data` / `error`
- [x] Pesan galat berbahasa Indonesia dan sama persis dengan Acceptance Criteria
- [x] Kode status HTTP sesuai standar (daftar kosong dijawab 200, bukan error)
- [x] Tanggal ISO 8601, uang bilangan bulat rupiah tanpa desimal, status huruf kecil snake_case
- [x] Event memiliki `event_id` unik dan penerima melakukan deduplikasi
- [x] File `docs/openapi.yaml` sudah sesuai kode dan bisa dibuka di `/api/m4/v1/docs` dan `/docs`
