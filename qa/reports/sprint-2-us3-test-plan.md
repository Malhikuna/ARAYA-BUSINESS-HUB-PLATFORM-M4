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

Memastikan pembayaran tagihan oleh *Customer Tamu* (tanpa akun) melalui **Midtrans Snap Sandbox** memproses notifikasi webhook secara otomatis, aman terhadap pemalsuan signature (`SHA-512`), idempoten saat *replay*, dan mempertahankan status `UNPAID` apabila transaksi gagal/kedaluwarsa.

---

## 2. Skenario Wajib `PRO-61` (`TC-M4US3-01` s/d `05`)

| Kode Uji & AC | Skenario | Endpoint / Aktor | Kriteria Lulus (Expected Result) |
|---|---|---|---|
| **`TC-M4US3-01`**<br>(US3-AC1) | Pembayaran Berhasil (`settlement`/`capture`) | `POST /api/m4/v1/webhooks/payments/midtrans` | HTTP `200 OK`; `invoices.status` otomatis menjadi `PAID` (*Lunas*); `paid_at` & `payment_method` tercatat tanpa aksi manual Partner. |
| **`TC-M4US3-02`**<br>(US3-AC2) | Pembayaran Gagal / Batal / Expired | `POST /api/m4/v1/webhooks/payments/midtrans` | Payload `deny`, `cancel`, atau `expire` tetap mempertahankan `invoices.status = UNPAID` (*Belum lunas*) agar Customer dapat bayar ulang. |
| **`TC-M4US3-03`**<br>(US3-AC3 / NFR-03) | Keamanan Signature Palsu | `POST /api/m4/v1/webhooks/payments/midtrans` | `signature_key` yang tidak cocok dengan `SHA512(order_id + status_code + gross_amount + SERVER_KEY)` ditolak **`HTTP 401`**; status invoice tidak berubah. |
| **`TC-M4US3-04`**<br>(IT-WH-03) | Uji Replay (Idempotensi 5x) | `POST /api/m4/v1/webhooks/payments/midtrans` | Pengiriman payload `settlement` identik 5 kali berturut-turut merespons `200 OK` tanpa crash atau duplikasi record. |
| **`TC-M4US3-05`**<br>(UT-PAY-05) | Proteksi Selisih Nominal | `POST /api/m4/v1/webhooks/payments/midtrans` | `gross_amount` berbeda dari `invoices.total_amount` ditolak (`AMOUNT_MISMATCH`) dan tidak melunasi invoice. |

---

## 3. Daftar Periksa Pengujian Sandbox + Tunnel (Saat Implementasi Dev Siap)

1. Pastikan `.env` lokal menggunakan PostgreSQL Docker port `5433` dan memiliki `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` mode Sandbox.
2. Jalankan tunnel publik (mis. `ngrok` / `cloudflared`) atau gunakan URL staging Vercel agar webhook Midtrans Sandbox dapat menjangkau `POST /api/m4/v1/webhooks/payments/midtrans`.
3. Aktifkan *it.todo* pada [`tests/unit/payment-webhook.test.ts`](file:///c:/Users/ahmad/ARAYA-BUSINESS-HUB-PLATFORM-M4-1/tests/unit/payment-webhook.test.ts) menjadi assertion aktif begitu `PRO-57` dan `PRO-58` selesai diimplementasikan.
