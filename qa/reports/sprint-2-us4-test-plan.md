# Rencana Pengujian & Persiapan TDD — Sprint 2 (`PRO-68` / `M4-US4` & Integrasi `M5-US4`)
## Pembaruan Status Order, Checkout Tamu & Lacak Pesanan Tanpa Akun

| Atribut Dokumen | Keterangan |
|---|---|
| **Kode Dokumen** | `QA-PLAN-M4-S2-002` |
| **Tiket QA** | `PRO-68` (Induk: `PRO-62` / `M4-US4`) |
| **Tiket Terkait (Dev)** | `PRO-63` (DB), `PRO-64` (BE Status), `PRO-65` (Figma), `PRO-66` (FE Partner), `PRO-67` (FE Customer), `PRO-69` (BE `K-04`) |
| **Lead QA / Tester** | Ahmad Dzaki (`ahmaddzaki141@gmail.com`) |
| **Status** | **TDD Prep Siap — Menunggu Implementasi `PRO-64`, `PRO-66`, `PRO-67`, `PRO-69`** |

---

## 1. Tujuan & Cakupan Pengujian

Memastikan integrasi *Guest Checkout* dari Modul 5 (**Kontrak `K-04`**) menghasilkan Order (`baru`) dan Invoice (`belum_lunas`) tanpa login Customer, Partner dapat memperbarui progres order secara satu arah (`Baru -> Diproses -> Selesai`), dan Customer Tamu dapat melacak status pesanan secara aman menggunakan **Nomor Invoice + 4 digit akhir WhatsApp** (`BR-12`, `NFR-02`).

---

## 2. Skenario Wajib `PRO-68` (`TC-M4US4-00` s/d `04`)

| Kode Uji & AC | Skenario | Endpoint / Aktor | Kriteria Lulus (Expected Result) |
|---|---|---|---|
| **`TC-M4US4-00`**<br>(Kontrak `K-04`) | Integrasi Checkout Tamu dari M5 | `POST /api/m4/v1/orders` | HTTP `201 Created`; membentuk `orders` (`baru`) + `invoices` (`belum_lunas`); *upsert* `customers` via nomor WhatsApp (`U-03`, `TB-05`); validasi kondisional `BR-11` (`address` Produk vs `email` + `notes` Jasa). |
| **`TC-M4US4-01`**<br>(US4-AC1 / BR-09) | Update Status Order (`Baru -> Diproses -> Selesai`) | `PATCH /api/m4/v1/orders/[id]/status` | Status tersimpan dan `orders.status_updated_at` diperbarui akurat dengan waktu server (dengan verifikasi `U-01` invoice lunas sebelum diproses). |
| **`TC-M4US4-02`**<br>(US4-AC2 / BRQ-09) | Proteksi Status Final (`Selesai`) | `/order` UI & `PATCH .../status` | Di UI tombol ubah status nonaktif (*disabled*); di API ditolak (`HTTP 422 ORDER_ALREADY_COMPLETED`). |
| **`TC-M4US4-03`**<br>(US4-AC3 / TB-04) | Lacak Pesanan Tamu Valid & Masking PII | `GET /api/m4/v1/orders/track` | Menampilkan status terkini (`baru`/`diproses`/`selesai`), `status_updated_at`, dan hanya `customer_name_masked` tanpa membocorkan nama asli, `phone`, `email`, atau `address`. |
| **`TC-M4US4-04`**<br>(US4-AC4 / NFR-02) | Proteksi Privasi, Anti-Enumerasi & Brute-Force | `GET /api/m4/v1/orders/track` | Baik invoice tidak ada maupun 4 digit WA salah ditolak seragam dengan **`HTTP 404`** dan pesan generik (*"Pesanan tidak ditemukan atau kombinasi verifikasi tidak cocok"*); percobaan gagal `> 5x` per 15 menit dibatasi **`HTTP 429 Too Many Requests`**. |

---

## 3. Verifikasi Mock Kontrak `K-04` dengan Stoplight Prism

> **Prerequisite Sinkronisasi OpenAPI:** `npm run mock:m5` menjalankan Stoplight Prism berdasarkan `docs/api/openapi.yaml`, yang saat ini masih memakai skema v1 lama (`customer_id: integer`, `product_id: integer`, serta belum memuat `/orders/track`). Pastikan `docs/api/openapi.yaml` telah disinkronkan dengan kontrak `K-04` *Guest Checkout* di PRD sebelum mock server dipakai untuk pengujian QA.

Setelah kontrak OpenAPI sinkron, QA dapat menyalakan mock server:
```bash
npm run mock:m5
```
Lalu aktifkan *it.todo* pada [`tests/unit/order-status.test.ts`](../../tests/unit/order-status.test.ts) dan [`tests/unit/order-tracking.test.ts`](../../tests/unit/order-tracking.test.ts) menjadi assertion penuh saat `PRO-64` & `PRO-69` siap.
