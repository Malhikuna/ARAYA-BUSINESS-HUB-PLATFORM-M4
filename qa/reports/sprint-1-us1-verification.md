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
| **Status Akhir** | **APPROVED / LULUS (Siap Dipindahkan ke Done)** |

---

## 1. Ringkasan Eksekutif

Laporan ini memverifikasi pemenuhan seluruh Acceptance Criteria (AC) pada **User Story 1 (`M4-US1`: Mengelola Data Produk/Jasa & Pelanggan)** serta mengevaluasi kelayakan *Definition of Done (DoD)* untuk tiket antarmuka pengguna `PRO-15` (Halaman & Form Produk/Jasa) dan `PRO-16` (Halaman & Form Pelanggan) yang sebelumnya berstatus *In Review*.

Berdasarkan pengujian otomatis (23/23 unit/integration tests lulus) dan verifikasi skenario manual di peramban, seluruh persyaratan fungsional, aturan bisnis (`TB-06`, `BR-02`, `BR-04`, `BR-11`), dan standar desain UI telah terpenuhi dengan predikat **LULUS (Passed)**.

---

## 2. Hasil Eksekusi Uji Otomatis (Automated Test Execution)

Pengujian otomatis dieksekusi menggunakan runner bawaan Node.js (`tsx --test`) terhadap berkas pengujian domain M4-US1:
```bash
npx tsx --test tests/unit/product-api.test.ts tests/unit/customer-api.test.ts tests/unit/export-product-pdf.test.ts tests/unit/export-customer-pdf.test.ts
```

| Test Suite File | Jumlah Test | Status | Keterangan Cakupan |
|---|---|---|---|
| `tests/unit/product-api.test.ts` | 9 | **PASS** | Validasi skema Zod, auto-SKU `SRV-...` (TB-06), tolak duplikat SKU (409), paginasi katalog |
| `tests/unit/customer-api.test.ts` | 9 | **PASS** | Validasi input pelanggan, tolak duplikat email/telepon (409), amplop seragam |
| `tests/unit/export-product-pdf.test.ts` | 2 | **PASS** | Utilitas ekspor katalog PDF 1.4 A4 dengan filter '|' |
| `tests/unit/export-customer-pdf.test.ts` | 3 | **PASS** | Utilitas ekspor pelanggan PDF 1.4 multi-halaman |
| **TOTAL** | **23** | **100% PASS** | Durasi: ~11 detik, 0 failed, 0 skipped |

---

## 3. Matriks Hasil Pengujian Acceptance Criteria (Manual & Fungsional)

| Kode Uji & AC | Skenario Pengujian | Hasil Pengujian Aktual | Status |
|---|---|---|---|
| **`TC-M4US1-01`**<br>(US1-AC1) | **Simpan Produk Fisik Valid (Happy Path):** Mengisi nama, kategori, unit, stok, dan harga pada form tambah produk. | Form tersimpan sukses, kode SKU otomatis terbit dengan format `PRD-...`, data tampil pada tabel dan siap untuk penawaran. | **PASSED** |
| **`TC-M4US1-02`**<br>(US1-AC1) | **Simpan Pelanggan Valid (Happy Path):** Mengisi nama, nomor WhatsApp valid, email, dan alamat pengiriman. | Notifikasi "Pelanggan tersimpan" tampil, tersimpan di database lokal, data langsung muncul di daftar pelanggan. | **PASSED** |
| **`TC-M4US1-03`**<br>(US1-AC2) | **Tolak Produk Tidak Lengkap (Negative Test):** Mengosongkan kolom nama atau mengisi harga negatif/kosong. | Form memblokir pengiriman, menampilkan pesan galat spesifik di bawah input yang menjelaskan cara perbaikan (sesuai PRO-15). | **PASSED** |
| **`TC-M4US1-04`**<br>(US1-AC2) | **Tolak Pelanggan Tidak Lengkap (Negative Test):** Mengosongkan nama atau format email salah. | Sistem menolak input, menampilkan pesan "Data belum lengkap" beserta penanda kolom wajib bertanda bintang (`*`). | **PASSED** |
| **`TC-M4US1-05`**<br>(US1-AC3 / TB-06) | **Aturan Tampilan Katalog Jasa:** Form dan tabel ketika memilih tipe Jasa. | Kolom Stok, SKU, dan Berat disembunyikan sepenuhnya di UI Partner Jasa; backend secara otomatis menghasilkan kode `SRV-YYYYMM-XXXX`. | **PASSED** |
| **`TC-M4US1-06`**<br>(US1-AC4) | **Proteksi Duplikasi Pelanggan:** Menginput email atau nomor telepon yang sudah terdaftar. | Sistem merespons dengan HTTP 409 Conflict dan menampilkan pesan jelas "Pelanggan sudah terdaftar" (sesuai PRO-16). | **PASSED** |

---

## 4. Evaluasi Kepatuhan 10 Poin Panduan UI Bersama v1.0

Pemeriksaan kode dan antarmuka komponen `src/components/produk/` dan `src/components/pelanggan/`:

1. [x] **UI-01 (Warna Token CSS):** Menggunakan variabel CSS semantik (`background`, `surface`, `border`, `text-slate-800`).
2. [x] **UI-02 (Badge Status Semantik):** Menggunakan warna hijau (Aktif), abu-abu (Nonaktif/Draft), merah (Error/Gagal).
3. [x] **UI-03 (Tipografi Bersama):** Heading menggunakan `Plus Jakarta Sans`, data/tabel menggunakan `Source Sans 3`.
4. [x] **UI-04 (Kerangka Halaman):** Navbar sticky 56px, sidebar 240px konsisten di seluruh halaman `/produk` dan `/pelanggan`.
5. [x] **UI-05 (Hirarki Tombol Aksi):** 1 tombol aksi utama (*Primary* warna `#19376d`), tombol batal/kembali di sebelah kiri.
6. [x] **UI-06 (Format Tabel Data):** Kolom harga rata kanan (`text-right`), dilengkapi kondisi *empty state* dan *loading state*.
7. [x] **UI-07 (Formulir & Pesan Galat):** Label berada di atas field, tanda bintang (`*`) pada kolom wajib, pesan galat instruktif.
8. [x] **UI-08 (Format Finansial & Tanggal):** Format Rupiah standar (`Rp 1.250.000` pemisah titik ribuan) dan tanggal format Indonesia.
9. [x] **UI-09 (Responsif 400px):** Tidak ada horizontal scroll liar pada lebar 400px; tabel berada dalam kontainer `overflow-x-auto`.
10. [x] **UI-10 (Larangan Ikon Khusus):** **Bebas 100% dari ikon keyboard fisik** dan **bebas 100% dari logo bintang Gemini**. Hanya menggunakan ikon Lucide React yang relevan bisnis.

---

## 5. Verifikasi Definition of Done (DoD) & Batas Baris Kode

Pemeriksaan ukuran berkas komponen modular per domain (batas maksimal 400 baris, ideal < 300 baris):
- `ProductFormView.tsx`: 258 baris (*Lulus*)
- `ProductTableCard.tsx`: 255 baris (*Lulus*)
- `ProductTableRow.tsx`: 133 baris (*Lulus*)
- `CustomerFormView.tsx`: 265 baris (*Lulus*)
- `CustomerTableCard.tsx`: 280 baris (*Lulus*)
- `CustomerProfileSidebar.tsx`: 134 baris (*Lulus*)
- **Strict TypeScript:** 0 penggunaan tipe `any`, strict type checking aktif.
- **Code Cleanliness:** Bebas dari `console.log` sisa debug dan bebas dari kode mati (*dead code*).

---

## 6. Keputusan Quality Gate & Rekomendasi Linear

Berdasarkan seluruh hasil pengujian dan audit di atas:
- [x] **PRO-15 (Frontend Produk/Jasa):** **APPROVED $\rightarrow$ Move to Done**
- [x] **PRO-16 (Frontend Pelanggan):** **APPROVED $\rightarrow$ Move to Done**
- [x] **PRO-17 (Uji AC US1 & Review QA):** **VERIFIED $\rightarrow$ Move to Done**

### Teks Pengisian Daily Scrum / Komentar Linear QA (Ahmad Dzaki):
> "Menyelesaikan verifikasi otomatis (23 unit test pass) dan uji manual 6 skenario Acceptance Criteria M4-US1 (TC-M4US1-01 s/d 06): validasi field wajib produk/pelanggan, adaptasi katalog jasa tanpa kolom stok/berat (TB-06), dan proteksi anti-duplikasi email/telepon pelanggan (HTTP 409). Memastikan kepatuhan 10 poin Checklist UI Bersama v1.0 dan menandatangani persetujuan DoD untuk menutup tiket PRO-15, PRO-16, dan PRO-17 menjadi Done."
