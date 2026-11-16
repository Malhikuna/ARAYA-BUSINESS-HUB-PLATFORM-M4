# Laporan Verifikasi Kualitas & Quality Gate DoD — Sprint 1 (M4-US2 & PRO-48)
## Araya Business Hub Platform — Modul 4: Penawaran & Tagihan Penjualan

| Atribut Dokumen | Keterangan |
|---|---|
| **Kode Dokumen** | `QA-REP-M4-S1-002` (Quality Gate Verification Sign-off) |
| **Tiket Terkait** | `PRO-54` (QA Verification), `PRO-48` (Kalkulasi BE), `PRO-50` (Konversi BE), `PRO-52` (FE Penawaran), `PRO-53` (FE Invoice) |
| **Lead QA / Tester** | Ahmad Dzaki (`ahmaddzaki141@gmail.com`) |
| **Pengembang Terverifikasi** | Hikmal Maulana (Backend & Calculation), Muh Ikhsan (Frontend), Murod (Database) |
| **Tanggal Eksekusi** | 16 November 2026 |
| **Lingkungan Uji** | PostgreSQL 17 Docker Lokal (Port `5433`) & Branch `develop` |
| **Status Akhir** | **APPROVED / LULUS (Seluruh Tiket Sprint 1 Siap Ditutup ke Done)** |

---

## 1. Ringkasan Eksekutif

Laporan ini memverifikasi pemenuhan seluruh Acceptance Criteria (AC) pada **User Story 2 (`M4-US2`: Membuat Penawaran & Invoice Penjualan)** serta mengaudit kebenaran matematis dari service kalkulasi finansial `PRO-48` (*Round-Half-Up* non-float), endpoint konversi `PRO-50`, dan halaman frontend penawaran (`PRO-52`) serta tagihan (`PRO-53`).

Melalui kombinasi pengujian unit (28/28 tests lulus) dan pengujian otomatis peramban Playwright E2E (`tests/e2e/m4-us2.spec.ts`), seluruh alur transaksi dari inisiasi penawaran, perhitungan PPN 11%, persetujuan customer, hingga proteksi konversi tagihan telah terbukti akurat, aman, dan memenuhi seluruh kriteria *Definition of Done (DoD)*.

---

## 2. Hasil Eksekusi Uji Otomatis (Unit & Integration Tests)

Pengujian dieksekusi menggunakan runner bawaan Node.js (`tsx --test`) terhadap berkas pengujian domain kalkulasi, penawaran, dan konversi invoice:
```bash
npx tsx --test tests/unit/calculation-service.test.ts tests/unit/quotation-api.test.ts tests/unit/quotation-converter.test.ts
```

| Test Suite File | Jumlah Test | Status | Keterangan Cakupan |
|---|---|---|---|
| `tests/unit/calculation-service.test.ts` | 13 | **PASS** | Pengujian fungsi `roundHalfUp()`, kalkulasi baris item, batas diskon maksimal, validasi kuantitas/harga/diskon negatif, dan presisi pembulatan tanpa akumulasi galat float. |
| `tests/unit/quotation-api.test.ts` | 6 | **PASS** | Validasi minimal 1 item baris, penolakan item tak terdaftar, pembuatan penawaran dengan nomor urut unik `PNW-...`, paginasi daftar penawaran. |
| `tests/unit/quotation-converter.test.ts` | 9 | **PASS** | Konversi penawaran `APPROVED` ke invoice `UNPAID` ("Belum lunas"), penolakan konversi status `DRAFT`/`SENT`/`REJECTED` (422 `QUOTATION_NOT_APPROVED`), idempotensi/anti-duplikasi konversi. |
| **TOTAL** | **28** | **100% PASS** | Durasi: ~11 detik, 0 failed, 0 skipped |

---

## 3. Matriks Hasil Pengujian Acceptance Criteria (Manual & E2E Playwright)

Pengujian E2E dijalankan melalui skenario Playwright pada berkas `tests/e2e/m4-us2.spec.ts`:

| Kode Uji & AC | Skenario Pengujian | Hasil Pengujian Aktual | Status |
|---|---|---|---|
| **`TC-M4US2-01`**<br>(US2-AC4 / PRO-48) | **Kalkulasi Otomatis Subtotal, Diskon & PPN 11%:** Item dengan kuantitas 2, harga satuan Rp 75.000, PPN 11%. | Subtotal Baris = Rp 150.000, PPN 11% = Rp 16.500 (*Round-Half-Up*), Grand Total = Rp 166.500. Angka tampil akurat pada ringkasan penawaran. | **PASSED** |
| **`TC-M4US2-02`**<br>(US2-AC2 / TB-02) | **Proteksi Penawaran Belum Disetujui:** Mencoba membuat invoice dari penawaran berstatus "Menunggu persetujuan". | UI memblokir aksi dan menampilkan `FormAlertBanner` ("Invoice belum dapat dibuat - Penawaran belum disetujui"). API menolak dengan HTTP 422 `QUOTATION_NOT_APPROVED`. | **PASSED** |
| **`TC-M4US2-03`**<br>(US2-AC3 / BR-06) | **Pencatatan Persetujuan Customer:** Partner menekan tombol "Setujui" setelah konfirmasi pelanggan. | Status penawaran berubah dari "Menunggu persetujuan" menjadi "Disetujui" (`APPROVED`) dengan badge hijau semantik dan notifikasi toast sukses. | **PASSED** |
| **`TC-M4US2-04`**<br>(US2-AC1 / U-04) | **Konversi Penawaran Disetujui ke Invoice:** Menekan tombol "Buat invoice" pada penawaran yang sudah "Disetujui". | Pengguna dialihkan ke `/invoice?quotation_id=...`, invoice baru berstatus "Belum lunas" (`UNPAID`) berhasil diterbitkan dengan total nominal identik 100%. | **PASSED** |
| **`TC-M4US2-05`**<br>(US2-AC3 / UT-DOC-06) | **Tolak Penawaran Tanpa Item Baris:** Mencoba menyimpan penawaran dengan array items kosong (`[]`). | Sistem menolak dengan HTTP 422 dan pesan validasi mewajibkan minimal 1 item produk/jasa. | **PASSED** |

---

## 4. Evaluasi Kepatuhan Integritas Finansial (PRO-48)

Sesuai aturan ketat pada `docs/workflows/coding-standards.md` dan `AGENTS.md`:
1. **Eliminasi Floating-Point:** Seluruh perhitungan moneter pada `calculation.service.ts` tidak menggunakan operasi float sembarangan, melainkan dibulatkan per baris menggunakan metode baku:
   $$\text{roundHalfUp}(val) = \frac{\text{Math.round}((val + \epsilon) \times 100)}{100}$$
2. **Kesesuaian Tipe Data Basis Data:** Menggunakan tipe `DECIMAL(15,2)` pada skema Supabase PostgreSQL 17 (`prisma/schema.prisma`).
3. **Anti Diskon Negatif & Over-Discount:** Nilai diskon diproteksi dengan batas atas maksimal sebesar subtotal baris (`applied_discount = Math.min(discount, gross)`).

---

## 5. Evaluasi Definition of Done (DoD) & Kerapian Kode

- **Batas Baris Kode per File:** Seluruh komponen `src/components/penawaran/` dan service `src/lib/services/` berukuran < 300 baris:
  - `calculation.service.ts`: 192 baris (*Lulus*)
  - `quotation.service.ts`: 256 baris (*Lulus*)
  - `QuotationItemTable.tsx`: 185 baris (*Lulus*)
  - `QuotationDetailInfoCard.tsx`: 181 baris (*Lulus*)
  - `QuotationTable.tsx`: 138 baris (*Lulus*)
- **Strict TypeScript:** Tidak ada tipe `any`, 0 error linter.
- **Bebas Ikon Terlarang:** 100% bebas dari ikon keyboard fisik dan logo Gemini.

---

## 6. Keputusan Quality Gate & Penutupan Sprint 1

Dengan diterbitkannya laporan ini:
- [x] **PRO-48 (Service Kalkulasi Finansial):** **VERIFIED $\rightarrow$ Done**
- [x] **PRO-50 (Endpoint Konversi Quotation):** **VERIFIED $\rightarrow$ Done**
- [x] **PRO-52 (Frontend Penawaran):** **VERIFIED $\rightarrow$ Done**
- [x] **PRO-53 (Frontend Invoice):** **VERIFIED $\rightarrow$ Done**
- [x] **PRO-54 (Uji AC US2 & Review DoD QA):** **APPROVED $\rightarrow$ Move to Done**

**Dengan ini, seluruh tiket pengujian Sprint 1 (`PRO-218`, `PRO-17`, `PRO-54`) telah selesai 100% dan seluruh tiket tim terkait telah berstatus Done.**

### Teks Pengisian Daily Scrum / Komentar Linear QA (Ahmad Dzaki):
> "Menyelesaikan verifikasi otomatis (28 unit test pass + Playwright E2E m4-us2.spec.ts) dan uji manual alur penawaran hingga tagihan M4-US2 (TC-M4US2-01 s/d 05): memvalidasi akurasi perhitungan subtotal, diskon, dan PPN 11% Round-Half-Up non-float (PRO-48), menguji persetujuan penawaran, serta memastikan penolakan konversi invoice jika belum disetujui (HTTP 422 / alert banner). Menyetujui DoD untuk tiket PRO-48, PRO-50, PRO-52, PRO-53, dan PRO-54. Seluruh tugas QA Sprint 1 resmi tuntas 100% Done."
