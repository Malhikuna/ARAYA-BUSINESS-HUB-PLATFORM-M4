# Laporan Verifikasi Kualitas & Quality Gate DoD — Sprint 1 (M4-US1)
## Araya Business Hub Platform — Modul 4: Penawaran & Tagihan Penjualan

| Atribut Dokumen | Keterangan |
|---|---|
| **Kode Dokumen** | `QA-REP-M4-S1-001` (Quality Gate Verification Sign-off) |
| **Tiket Terkait** | `PRO-17` (QA Verification), `PRO-15` (FE Produk), `PRO-16` (FE Pelanggan) |
| **Lead QA / Tester** | Ahmad Dzaki (`ahmaddzaki141@gmail.com`) |
| **Pengembang Terverifikasi** | Muh Ikhsan (Frontend), Hikmal Maulana (Backend), Murod (Database) |
| **Tanggal Eksekusi** | 16 November 2026 |
| **Lingkungan Uji** | PostgreSQL 17 Docker Lokal (Port `5433`) & Branch `develop` |
| **Status Akhir** | **APPROVED WITH FOLLOW-UP NOTES (API/Unit 100% Lulus; Catatan UI untuk Tiket Bugfix Terpisah)** |

---

## 1. Ringkasan Eksekutif

Laporan ini memverifikasi pemenuhan Acceptance Criteria (AC) pada **User Story 1 (`M4-US1`: Mengelola Data Produk/Jasa & Pelanggan)** serta mengevaluasi kelayakan *Definition of Done (DoD)* untuk tiket antarmuka pengguna `PRO-15` (Halaman & Form Produk/Jasa) dan `PRO-16` (Halaman & Form Pelanggan).

Berdasarkan pengujian otomatis (`23/23` unit/integration test lulus 100%) dan verifikasi skenario manual di peramban, seluruh logika API backend dan alur utama desktop telah berfungsi baik, dengan sejumlah temuan *Known Issues / Follow-up Fix* pada integrasi error envelope FE, token tema gelap, dan sidebar mobile yang dicatat pada **Section 6** untuk perbaikan terpisah.

---

## 2. Hasil Eksekusi Uji Otomatis (Automated Test Execution)

Pengujian otomatis dieksekusi menggunakan runner bawaan Node.js (`tsx --test`) terhadap berkas pengujian domain `M4-US1`:
```bash
npx tsx --test tests/unit/product-api.test.ts tests/unit/customer-api.test.ts tests/unit/export-product-pdf.test.ts tests/unit/export-customer-pdf.test.ts
```

| Test Suite File | Jumlah Test | Status | Keterangan Cakupan |
|---|---|---|---|
| `tests/unit/product-api.test.ts` | 9 | **PASS** | Validasi skema Zod, auto-SKU `SRV-...` (TB-06), tolak duplikat SKU (409), paginasi katalog |
| `tests/unit/customer-api.test.ts` | 9 | **PASS** | Validasi input pelanggan, tolak duplikat email/telepon (409), amplop seragam |
| `tests/unit/export-product-pdf.test.ts` | 2 | **PASS** | Utilitas ekspor katalog PDF 1.4 A4 dengan filter `'\|'` |
| `tests/unit/export-customer-pdf.test.ts` | 3 | **PASS** | Utilitas ekspor pelanggan PDF 1.4 multi-halaman |
| **TOTAL** | **23** | **100% PASS** | Durasi: ~11 detik, 0 failed, 0 skipped |

---

## 3. Matriks Hasil Pengujian Acceptance Criteria (Manual & Fungsional)

| Kode Uji & AC | Skenario Pengujian | Hasil Pengujian Aktual | Status |
|---|---|---|---|
| **`TC-M4US1-01`**<br>(US1-AC1) | **Simpan Produk Fisik Valid (Happy Path):** Mengisi nama, kategori, unit, stok, dan harga pada form tambah produk. | Data tersimpan di UI & dikirim ke API (`PRD-...` terbit). *Catatan:* `mock-products.ts` masih memanggil `POST /api/m4/v1/products` tanpa `await` (*fire-and-forget*). | **PASSED (with Note)** |
| **`TC-M4US1-02`**<br>(US1-AC1) | **Simpan Pelanggan Valid (Happy Path):** Mengisi nama, nomor WhatsApp valid, email, dan alamat pengiriman. | Notifikasi "Pelanggan tersimpan" tampil, tersimpan di database lokal, data muncul di daftar pelanggan. | **PASSED** |
| **`TC-M4US1-03`**<br>(US1-AC2) | **Tolak Produk Tidak Lengkap (Negative Test):** Mengosongkan kolom nama atau mengisi harga negatif/kosong. | Form memblokir pengiriman, menampilkan pesan galat spesifik di bawah input yang menjelaskan cara perbaikan (sesuai PRO-15). | **PASSED** |
| **`TC-M4US1-04`**<br>(US1-AC2) | **Tolak Pelanggan Tidak Lengkap (Negative Test):** Mengosongkan nama atau format email salah. | Sistem menolak input, menampilkan pesan "Data belum lengkap" beserta penanda kolom wajib bertanda bintang (`*`). | **PASSED** |
| **`TC-M4US1-05`**<br>(US1-AC3 / TB-06) | **Aturan Tampilan Katalog Jasa:** Form dan tabel ketika memilih tipe Jasa. | Di mode Jasa, kolom Stok/SKU/Berat disembunyikan & backend auto-generate `SRV-...`. *Catatan:* Pada `businessMode === "Semua"` saat kategori `"Jasa"` dipilih, `ProductFormView.tsx:162-166` masih merender `Kode: SRV-...`. | **PASSED (with Note)** |
| **`TC-M4US1-06`**<br>(US1-AC4) | **Proteksi Duplikasi Pelanggan:** Menginput email atau nomor telepon yang sudah terdaftar. | Backend API merespons tepat dengan `HTTP 409 Conflict` (`error.code`). *Catatan:* Di FE, `tambah/page.tsx` & `ubah/[id]/page.tsx` masih membaca `json.code` alih-alih `json.error.code` (lihat Section 6). | **PASSED (API) / Follow-up FE** |

---

## 4. Evaluasi Kepatuhan 10 Poin Panduan UI Bersama v1.0

Pemeriksaan kode dan antarmuka komponen `src/components/produk/` dan `src/components/pelanggan/`:

1. [ ] **UI-01 (Warna Token CSS):** *Partial / Follow-up* — `src/app/globals.css:18` sudah mendefinisikan `--primary: light-dark(#1e4fd8, #6b93ff)`, namun sejumlah komponen (`AppLayout.tsx`, `Navbar.tsx`, `ProductFormView.tsx`, `CustomerFormView.tsx`, `CustomerTableCard.tsx`) masih meng-hardcode hex (`bg-white`, `bg-[#f3f6fa]`, `bg-[#f0f4fa]`, `#19376d`) sehingga belum adaptif terhadap dark mode (`docs/design/ui-guidelines.md:24-26`).
2. [x] **UI-02 (Badge Status Semantik):** Menggunakan warna hijau (Aktif), abu-abu (Nonaktif/Draft), merah (Error/Gagal).
3. [x] **UI-03 (Tipografi Bersama):** Heading menggunakan `Plus Jakarta Sans`, data/tabel menggunakan `Source Sans 3`.
4. [x] **UI-04 (Kerangka Halaman):** Navbar sticky **64px (`h-16`)** selaras dengan `Sidebar.tsx` (`top-16`), sidebar 240px konsisten di seluruh halaman `/produk` dan `/pelanggan`.
5. [ ] **UI-05 (Hirarki Tombol Aksi):** *Partial / Follow-up* — Terdapat 1 tombol aksi utama dengan tombol batal di sebelah kiri, namun warna primary masih hardcode `#19376d` alih-alih token `--primary`, dan tombol `Batal` pada `CustomerFormView.tsx:241` memanggil `handleReset` bukan navigasi kembali ke `/pelanggan`.
6. [x] **UI-06 (Format Tabel Data):** Kolom harga rata kanan (`text-right`), dilengkapi kondisi *empty state* dan *loading state*.
7. [x] **UI-07 (Formulir & Pesan Galat):** Label berada di atas field, tanda bintang (`*`) pada kolom wajib, pesan galat instruktif.
8. [x] **UI-08 (Format Finansial & Tanggal):** Format Rupiah standar (`Rp 1.250.000` pemisah titik ribuan) dan tanggal format Indonesia.
9. [ ] **UI-09 (Responsif 400px):** *Follow-up* — Tabel berada dalam kontainer `overflow-x-auto` (bebas horizontal scroll), namun di viewport 400px `AppLayout.tsx:12` menginisialisasi `isSidebarOpen = true` sehingga backdrop sidebar mobile terbuka otomatis dan menghalangi klik tombol form.
10. [x] **UI-10 (Larangan Ikon Khusus):** Bebas 100% dari ikon keyboard fisik dan logo bintang Gemini; hanya menggunakan ikon Lucide React yang relevan bisnis.

---

## 5. Verifikasi Definition of Done (DoD) & Batas Baris Kode

Pemeriksaan total baris berkas komponen modular per domain (batas maksimal 400 baris, ideal < 300 baris):
- `ProductFormView.tsx`: 286 baris (*Lulus*)
- `ProductTableCard.tsx`: 272 baris (*Lulus*)
- `ProductTableRow.tsx`: 141 baris (*Lulus*)
- `CustomerFormView.tsx`: 290 baris (*Lulus*)
- `CustomerTableCard.tsx`: 292 baris (*Lulus*)
- `CustomerProfileSidebar.tsx`: 144 baris (*Lulus*)
- **Strict TypeScript:** 0 penggunaan tipe `any`, strict type checking aktif.
- **Code Cleanliness:** Bebas dari `console.log` sisa debug dan bebas dari kode mati (*dead code*).

---

## 6. Known Issues / Follow-up Fix & Keputusan Quality Gate

Daftar temuan UI untuk ditindaklanjuti pada tiket `bugfix/` terpisah oleh Frontend (`Muh Ikhsan`):
1. **Sinkronisasi Error Envelope 409 Pelanggan:** `src/app/pelanggan/tambah/page.tsx:30-36` & `src/app/pelanggan/ubah/[id]/page.tsx:86-92` perlu membaca `json.error.code` (sesuai `src/lib/auth/response.ts:23-30`) dan tidak menyimpan ke `sessionStorage` / redirect di blok `catch` saat API gagal.
2. **Await POST Produk:** `src/lib/data/mock-products.ts:110-125` perlu memanggil `await fetch(...)` agar error penyimpanan dari server tidak tersembunyi.
3. **`TB-06` di Mode `Semua`:** `src/components/produk/ProductFormView.tsx:162-166` masih merender pratinjau `Kode: SRV-...` saat `businessMode === "Semua"` dan kategori `"Jasa"` dipilih.
4. **Navigasi Tombol `Batal` Pelanggan:** `src/components/pelanggan/CustomerFormView.tsx:241` perlu diarahkan kembali ke `/pelanggan` pada mode tambah baru.
5. **Adaptasi Dark Mode & Sidebar Mobile 400px:** Mengganti warna hex hardcode ke semantic CSS tokens (`globals.css`) serta menyetel `isSidebarOpen` default tertutup di layar `< 768px` (`AppLayout.tsx:12`).

**Keputusan Quality Gate:**
- **PRO-17 (Uji AC US1 & Review QA):** **VERIFIED $\rightarrow$ Done** *(seluruh test otomatis 23/23 lulus dan temuan FE telah terdokumentasi untuk follow-up).*
- **PRO-15 & PRO-16:** **APPROVED WITH FOLLOW-UP NOTES** *(siap ditindaklanjuti lewat tiket bugfix terpisah).*
