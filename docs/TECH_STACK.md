# Spesifikasi Tech Stack & Arsitektur Sistem — Modul 4

**Araya Business Hub (ABH)**  
**Modul 4: Penawaran & Tagihan Penjualan (Quotation & Sales Invoice Management)**  
*Versi: 1.1 • November 2026*

---

## 1. Identitas Modul & Tim Pengembang

| Nama Anggota | Peran | Tanggung Jawab Utama |
|---|---|---|
| **Hikmal Maulana** | Backend & Integration Lead | Next.js API Route Handlers, Swagger UI, Middleware JWT/RBAC, Integrasi Midtrans & Webhook, CI/CD |
| **Muh Ikhsan** | Frontend Developer | Layout bersama, Tailwind CSS Tokens, Komponen Reusable UI, Interaktivitas Formulir |
| **Murod Adipate** | Database Administrator | PostgreSQL 17, Supabase Cloud Pooling, Prisma ORM Schema & Migration, Docker Compose DB lokal |
| **Ahmad Dzaki** | QA / SDET Lead | Infrastruktur Pengujian (Unit, E2E Playwright, Postman/Newman, Mocking M5 dengan Stoplight Prism) |

---

## 2. Matriks Komponen Tech Stack Lengkap

| Kategori | Teknologi / Pustaka | Versi | Justifikasi & Peran Fungsional |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `16.4.2` | React Server Components (RSC) untuk efisiensi render server, Server Actions, dan App Router terpadu. |
| **UI Library** | React & React-DOM | `19.3.0` | Komponen antarmuka modern dengan dukungan hooks terbaru dan concurrent rendering. |
| **Bahasa Pemrograman** | TypeScript (Strict Mode) | `5.x` | Menjamin type-safety dari skema database hingga payload API, zero tolerance tipe `any`. |
| **Styling & CSS** | Tailwind CSS & Turbopack | `4.0.0` | Utility-first CSS generasi terbaru, tokenisasi warna terang/gelap via CSS Variables. |
| **Tipografi** | Plus Jakarta Sans & Source Sans 3 | Google Fonts | Standar tipografi resmi UI bersama Araya (Heading: Plus Jakarta Sans, Body/Data: Source Sans 3). |
| **Ikonografi** | Lucide React | `1.66.0` | Ikon standar ERP bisnis; mematuhi aturan bebas ikon keyboard fisik dan bebas logo Gemini. |
| **Backend Runtime** | Node.js LTS | `20+` | Runtime JavaScript performa tinggi, eksekusi native ESM dan asynchronous I/O. |
| **API Architecture** | Next.js API Route Handlers | `16.4.2` | Menangani endpoint `/api/m4/v1/...` secara terstruktur, tanpa overhead framework terpisah seperti NestJS. |
| **Dokumentasi API** | OpenAPI 3.0 & Swagger UI | `3.0.3` | Kontrak API interaktif yang dapat diuji langsung melalui `/api/m4/v1/docs`. |
| **Standar Respons API** | Unified JSON Envelope | `v1.0 Panduan` | Format baku: `{ success, data, meta }` untuk 2xx dan `{ success: false, error }` untuk 4xx/5xx. |
| **Basis Data Cloud** | Supabase (PostgreSQL 17) | Cloud Managed | Database hosting cloud dengan pooling port 6543 (Supavisor) dan direct access port 5432. |
| **Basis Data Lokal** | Docker Compose (Postgres 17) | Compose v2 | Menjalankan kontainer database lokal secara terisolasi untuk pengembangan offline dan automated testing. |
| **ORM & DB Driver** | Prisma ORM & Adapter-pg | `7.10.1` | Type-safe query builder, migrasi deklaratif otomatis, proteksi SQL Injection, dan relasi transaksi ACID. |
| **Payment Gateway** | Midtrans Snap API & Webhook | Core API | Pembayaran instan VA, QRIS/GoPay, Kartu Kredit, dilengkapi verifikasi HMAC SHA-512 webhook signature. |
| **Otentikasi & Otorisasi** | Next.js Middleware + JWT | SSO M1 Format | Validasi Bearer token JWT dari Modul 1 dan proteksi hak akses berbasis role (Admin, Partner, Customer). |
| **QA: Unit Testing** | Node.js Test Runner via `tsx` (Jest-compatible) | `tsx 4.23` | Eksekusi unit test cepat dengan sintaksis standar industri (`describe`/`it`/`assert`) tanpa konflik ESM di Next.js 16. |
| **QA: E2E Testing** | Playwright Test Suite | `1.x` | Pengujian otomatis end-to-end simulasi browser untuk alur penawaran hingga tagihan (`playwright.config.ts`). |
| **QA: API Regression** | Postman & Newman | Collection v2.1 | Koleksi pengujian endpoint otomatis via `06_Postman_Collection_M4.json` yang dapat dijalankan di CI via Newman. |
| **QA: Service Mocking** | Stoplight Prism | CLI Latest | Mocking server untuk API Modul 5 (Order/BPU) berbasis `docs/openapi_m5_order_contract.yaml` agar tim tidak terblokir. |
| **QA: Integration Test** | Route Handlers + Local Postgres | Docker Compose | Uji integrasi endpoint langsung dengan Web API Request/Response dan database lokal PostgreSQL. |
| **Linter & Code Style** | ESLint 9 & Next Linter Config | `9.x` | Menjaga kebersihan kode dari unused imports, console.log debug, dan menjamin kepatuhan aturan PR. |
| **CI/CD & DevOps** | GitHub Actions Workflows | v4 Workflows | Otomatisasi validasi (lint, type-check, unit test, build) pada setiap Pull Request ke branch develop. |

---

## 3. Rincian Arsitektur Pengujian & Quality Assurance (QA Tools)

Sesuai dokumen rencana TDD & QA, pengujian Modul 4 menerapkan strategi piramida pengujian multi-layer:

1. **Unit Testing Layer (Jest-compatible via Node.js Native Runner & `tsx`):**
   * Fokus: Menguji fungsi-fungsi murni, kalkulasi diskon dan PPN (metode *Round-Half-Up* non-float), generator nomor dokumen (`QUO-YYYY-XXXX`, `INV-YYYY-XXXX`), format Rupiah/Tanggal, serta validasi skema Zod.
   * Perintah eksekusi: `npm test`
2. **Integration Testing Layer (API Route Handlers + Local Database):**
   * Fokus: Menguji controller API Next.js dengan mock session/JWT dan transaksi basis data lokal PostgreSQL menggunakan Docker Compose.
3. **End-to-End (E2E) Browser Testing Layer (Playwright):**
   * Fokus: Menguji alur pengguna nyata (User Story): membuat penawaran di form, melihat daftar penawaran, menyetujui penawaran, mengonversi ke invoice, dan simulasi pembayaran.
   * Perintah eksekusi: `npm run test:e2e`
4. **API Regression Testing (Postman & Newman):**
   * Fokus: Verifikasi kesesuaian endpoint API terhadap amplop standar respons (`success`, `data`, `meta`, `error`) menggunakan berkas koleksi resmi `06_Postman_Collection_M4.json`.
5. **Dependency Mocking (Stoplight Prism):**
   * Fokus: Menyediakan mock API server untuk Modul 5 (Pengadaan & Logistik) berdasarkan kontrak OpenAPI `docs/openapi_m5_order_contract.yaml`, sehingga pengujian alur konversi penawaran ke order di Modul 4 dapat berjalan mandiri meskipun Modul 5 belum online.

---

## 4. Prinsip Rekayasa Perangkat Lunak (Engineering Guardrails)

1. **Filosofi Ponytail (Anti Over-Engineering):** Solusi paling efisien dengan baris kode minimal yang teruji, tanpa abstraksi prematur (*YAGNI*).
2. **Integritas Finansial Ketat:** Dilarang menggunakan tipe `float` untuk nilai uang. Seluruh nominal menggunakan `NUMERIC(15,2)` dengan pembulatan *Round-Half-Up* per baris.
3. **Zero-Trust Input Validation:** Validasi ketat pada batasan sistem (*schema validation*) untuk mencegah eksploitasi XSS, SQL Injection, dan IDOR.
4. **Batas Baris Kode per File (Maksimal 300–400 Baris):** Memecah komponen UI dan data service secara modular per domain agar mudah dirawat.

---

## 5. Integrasi Antarmodul Ekosistem Araya Business Hub

- **Modul 1 (User Management & SSO):** Menerima token JWT Bearer yang memuat identitas user, partner ID, dan permissions `m4.*`.
- **Modul 2 (Akuntansi / Finance):** Mengirimkan event posting jurnal `acc.journal.create` saat invoice diterbitkan (Piutang Usaha) dan saat pembayaran terverifikasi lunas (Kas/Bank).
- **Modul 5 (Pengadaan & Logistik / Unit Usaha BPU):** Mengakomodasi permintaan layanan khusus BPU menjadi Penawaran Resmi (Quotation), dan meneruskan order terkonfirmasi ke Modul 5 saat penawaran disetujui.

---

## 6. Keputusan Arsitektur: Mengapa Fullstack Next.js Monorepo?

- **Zero CORS Overhead:** API dan Frontend berada dalam satu origin dan runtime terpadu.
- **Direct Type Sharing:** Tipe TypeScript dari Prisma dapat langsung digunakan di komponen frontend tanpa duplikasi DTO.
- **Efisiensi Waktu & Operasional Tim:** Menghindari kerumitan setup multi-repo, multi-container, dan boilerplate berat seperti NestJS.
