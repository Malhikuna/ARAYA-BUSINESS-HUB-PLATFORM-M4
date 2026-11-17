# Rencana Pengujian & Persiapan TDD — Sprint 2 (`PRO-61` / `M4-US3`)
## Pembayaran Invoice via Midtrans Sandbox & Verifikasi Webhook SHA-512

| Atribut Dokumen | Keterangan |
|---|---|
| **Kode Dokumen** | `QA-PLAN-M4-S2-001` |
| **Tiket QA** | `PRO-61` (Induk: `PRO-55` / `M4-US3`) |
| **Tiket Terkait (Dev)** | `PRO-56` (DB), `PRO-57` (Payment Service/Snap), `PRO-58` (Webhook), `PRO-59` (Figma), `PRO-60` (FE Bayar) |
| **Lead QA / Tester** | Ahmad Dzaki (`ahmaddzaki141@gmail.com`) |
| **Status** | **TDD Prep Siap — Menunggu Implementasi `PRO-57`, `PRO-58`, `PRO-60`** |

---

## 1. Tujuan & Cakupan Pengujian

Memastikan pembayaran tagihan oleh *Customer Tamu* (tanpa akun) melalui **Midtrans Snap Sandbox** memproses notifikasi webhook secara otomatis, aman terhadap pemalsuan signature (`SHA-512` menggunakan `crypto.timingSafeEqual`), idempoten saat *replay*, menerbitkan event `order.paid` (`K-09`) tepat satu kali, dan mempertahankan status `UNPAID` apabila transaksi gagal/`pending`/`challenge`.

---

## 2. Skenario Wajib `PRO-61` (`TC-M4US3-01` s/d `05` + `K-09`)

| Kode Uji & AC | Skenario | Endpoint / Aktor | Kriteria Lulus (Expected Result) |
|---|---|---|---|
| **`TC-M4US3-01`**<br>(US3-AC1) | Pembayaran Berhasil (`settlement` / `capture` + `fraud_status: accept`) | `POST /api/m4/v1/webhooks/payments/midtrans` | HTTP `200 OK`; `invoices.status` otomatis menjadi `PAID` (*Lunas*); `paid_at` & `payment_method` tercatat tanpa aksi manual Partner. *(Jika `capture` dengan `fraud_status` `challenge`/`deny`, tetap `UNPAID`).* |
| **`TC-M4US3-02`**<br>(US3-AC2) | Pembayaran `pending`, Gagal, Batal, atau Expired + Retry | `POST /api/m4/v1/webhooks/payments/midtrans` & `POST .../payments` | Payload `pending`, `deny`, `cancel`, atau `expire` mempertahankan `invoices.status = UNPAID`. Saat Customer retry bayar, backend menerbitkan `order_id` Snap baru agar tidak ditolak Midtrans (*"Order ID has already been taken"*). |
| **`TC-M4US3-03`**<br>(US3-AC3 / NFR-03) | Keamanan Signature Palsu & Malformed / Unknown | `POST /api/m4/v1/webhooks/payments/midtrans` | `signature_key` tidak cocok ditolak **`HTTP 401`**; `order_id` tak dikenal ditolak `HTTP 404`; payload rusak ditolak `HTTP 400`. Status invoice tidak berubah. |
| **`TC-M4US3-04`**<br>(IT-WH-03) | Uji Replay (Idempotensi 5x) & Event `K-09` | `POST /api/m4/v1/webhooks/payments/midtrans` | Replay payload `settlement` identik 5x merespons `200 OK` tanpa duplikasi, **tidak menimpa** `paid_at` & `payment_method` pertama, dan tidak *double-publish* event `order.paid` ke `POST /api/m9/v1/events`. |
| **`TC-M4US3-05`**<br>(UT-PAY-05) | Proteksi Selisih Nominal (`AMOUNT_MISMATCH`) | `POST /api/m4/v1/webhooks/payments/midtrans` | Komparasi string desimal (`"166500.00"` vs `Decimal(15,2)`) tanpa float; jika `gross_amount` berbeda dari `invoices.total_amount`, ditolak **`HTTP 422 AMOUNT_MISMATCH`** dan tidak melunasi invoice. |

---

## 3. Daftar Periksa Pengujian Sandbox + Tunnel & Prerequisite

1. Pastikan `.env` lokal menggunakan PostgreSQL Docker port `5433` dan memiliki `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` mode Sandbox.
2. **Prerequisite `IT-PAY-01` (Guest Payment):** `src/lib/auth/rbac.ts:27` saat ini masih mengunci `POST /api/m4/v1/invoices/[id]/payments` untuk JWT `Customer`/`Admin`; pastikan RBAC & verifikasi anti-IDOR *Customer Tamu* (Nomor Invoice + 4 digit WA per `prd-modul-m4.md:523`) diselaraskan sebelum uji publik dijalankan.
3. Jalankan tunnel publik (`ngrok` / `cloudflared`) atau URL staging Vercel agar webhook Midtrans Sandbox dapat menjangkau `POST /api/m4/v1/webhooks/payments/midtrans`.
4. Aktifkan *it.todo* pada [`tests/unit/payment-webhook.test.ts`](../../tests/unit/payment-webhook.test.ts) menjadi assertion aktif begitu `PRO-57` dan `PRO-58` selesai diimplementasikan.
