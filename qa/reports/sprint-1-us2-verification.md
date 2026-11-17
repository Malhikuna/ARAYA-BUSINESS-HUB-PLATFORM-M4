# Laporan Verifikasi Kualitas & Quality Gate DoD — Sprint 1 (M4-US2 & PRO-48)
## Araya Business Hub Platform — Modul 4: Penawaran & Tagihan Penjualan

| Atribut Dokumen | Keterangan |
|---|---|
| **Kode Dokumen** | `QA-REP-M4-S1-002` (Quality Gate Verification Sign-off) |
| **Tiket Terkait** | `PRO-54` (QA Verification), `PRO-48` (Kalkulasi BE), `PRO-49` (Quotation BE), `PRO-50` (Konversi BE), `PRO-52` (FE Penawaran), `PRO-53` (FE Invoice) |
| **Lead QA / Tester** | Ahmad Dzaki (`ahmaddzaki141@gmail.com`) |
| **Pengembang Terverifikasi** | Hikmal Maulana (Backend & Calculation), Muh Ikhsan (Frontend), Murod (Database) |
| **Tanggal Eksekusi** | 16 November 2026 |
| **Lingkungan Uji** | PostgreSQL 17 Docker Lokal (Port `5433`, sesuai `AGENTS.md` §4) & Branch `develop` |
| **Status Akhir** | **VERIFIED WITH FOLLOW-UP NOTES (Unit/Kalkulasi 100% Lulus; Catatan Integrasi UI/Konversi)** |

---

## 1. Ringkasan Eksekutif

Laporan ini memverifikasi pemenuhan Acceptance Criteria (AC) pada **User Story 2 (`M4-US2`: Membuat Penawaran & Invoice Penjualan)** serta mengaudit service kalkulasi finansial `PRO-48` (`calculation.service.ts`), endpoint quotation `PRO-49`, konversi legacy `PRO-50`, dan halaman frontend penawaran (`PRO-52`) serta tagihan (`PRO-53`).

Seluruh 28 unit/integration test lulus 100% dan alur persetujuan penawaran pada UI telah terverifikasi via Playwright (`tests/e2e/m4-us2.spec.ts`). Temuan terkait hal-hal yang masih bersifat *legacy/placeholder* (PPN UI `0%`, konversi legacy `/api/v1/...`, dan `/invoice` masih `UnderConstructionView`) dicatat secara transparan pada **Section 6** sebagai *follow-up* integrasi.

---

## 2. Hasil Eksekusi Uji Otomatis (Unit & Integration Tests)

Pengujian dieksekusi menggunakan runner bawaan Node.js (`tsx --test`) pada PostgreSQL 17 Docker Lokal (Port `5433`):
```bash
npx tsx --test tests/unit/calculation-service.test.ts tests/unit/quotation-api.test.ts tests/unit/quotation-converter.test.ts
```

| Test Suite File | Jumlah Test | Status | Keterangan Cakupan |
|---|---|---|---|
| `tests/unit/calculation-service.test.ts` | 13 | **PASS** | Pengujian `roundHalfUp()`, kalkulasi baris item, batas diskon maksimal, validasi nilai negatif, dan presisi pembulatan per baris. |
| `tests/unit/quotation-api.test.ts` | 6 | **PASS** | Validasi minimal 1 item baris (`HTTP 400 VALIDATION_ERROR`), penolakan produk tak terdaftar (`400`), pembuatan penawaran `PNW-...` (`201`), paginasi (`200`). |
| `tests/unit/quotation-converter.test.ts` | 9 | **PASS** | Menguji route **legacy** `/api/v1/quotations/[id]/convert` (*in-memory store*) dengan status `ACCEPTED -> ISSUED` dan penolakan status non-`ACCEPTED` (`422 QUOTATION_NOT_APPROVED`); belum membuat record `orders` (`U-04`) maupun memakai `/api/m4/v1/quotations/[id]/convert`. |
| **TOTAL** | **28** | **100% PASS** | Durasi: ~11 detik, 0 failed, 0 skipped |

---

## 3. Matriks Hasil Pengujian Acceptance Criteria (Manual & E2E Playwright)

Pengujian E2E dijalankan melalui skenario serial Playwright pada `tests/e2e/m4-us2.spec.ts`:

| Kode Uji & AC | Skenario Pengujian | Hasil Pengujian Aktual | Status |
|---|---|---|---|
| **`TC-M4US2-01`**<br>(US2-AC4 / PRO-48) | **Kalkulasi Subtotal, Diskon & PPN 11%:** Perhitungan pada `calculation.service.ts` dan form `/penawaran/tambah`. | Di `calculation-service.test.ts`, perhitungan PPN 11% *Round-Half-Up* lulus 100%. Di UI `/penawaran/tambah`, subtotal otomatis terhitung saat item & qty diisi, namun `src/app/penawaran/tambah/page.tsx:137` saat ini masih meng-hardcode `const taxAmount = 0;` (`Pajak (PPN 0%)`). | **PASSED (BE) / Follow-up FE** |
| **`TC-M4US2-02`**<br>(US2-AC2 / TB-02) | **Proteksi Penawaran Belum Disetujui:** Mencoba membuat invoice dari penawaran berstatus "Menunggu persetujuan". | UI memblokir aksi pada `QUO-010` dan menampilkan `FormAlertBanner` ("Invoice belum dapat dibuat - Penawaran belum disetujui"). Endpoint legacy `/api/v1/quotations/[id]/convert` menolak dengan `HTTP 422 QUOTATION_NOT_APPROVED`. | **PASSED** |
| **`TC-M4US2-03`**<br>(US2-AC3 / BR-06) | **Pencatatan Persetujuan Customer:** Partner menekan tombol "Setujui" pada detail penawaran. | Status UI berubah dari "Menunggu persetujuan" menjadi "Disetujui" (`APPROVED`) dengan badge hijau dan toast sukses. *(Catatan: pada data mock `QUO-010`, panggilan `PATCH /api/m4/v1/quotations/QUO-010/status` di background masih gagal 404 karena tidak ada di DB lokal).* | **PASSED (UI Mock)** |
| **`TC-M4US2-04`**<br>(US2-AC1 / U-04) | **Konversi Penawaran Disetujui ke Invoice:** Menekan tombol "Buat invoice" pada penawaran "Disetujui". | Klik "Buat invoice" mengarahkan ke `/invoice?quotation_id=QUO-010`, namun `src/app/invoice/page.tsx:5-13` saat ini masih `<UnderConstructionView>` dan konversi ke DB (`orders` + `invoices` via `/api/m4/v1/...`) menunggu penyempurnaan `PRO-50`/`PRO-53`. | **PARTIAL (Follow-up)** |
| **`TC-M4US2-05`**<br>(US2-AC3 / UT-DOC-06) | **Tolak Penawaran Tanpa Item Baris:** Mengirim `POST /api/m4/v1/quotations` dengan array `items: []`. | Sistem menolak dengan **`HTTP 400 VALIDATION_ERROR`** (`src/app/api/m4/v1/quotations/route.ts:62-64` & `tests/unit/quotation-api.test.ts:66`). | **PASSED** |

---

## 4. Evaluasi Integritas Finansial (`PRO-48`)

1. **Implementasi Saat Ini (`src/lib/services/calculation.service.ts:84-86,105-116`):** Fungsi `roundHalfUp()` menggunakan pembulatan per baris berbasis tipe JS `number` (`Math.round((value + Number.EPSILON) * 100) / 100`) dan seluruh `calculation-service.test.ts` (13/13) lulus tanpa kesalahan presisi untuk skenario uji standar, sementara kolom database menggunakan `DECIMAL(15,2)` pada `prisma/schema.prisma`.
2. **Catatan Peningkatan:** Karena masih memakai tipe JS `number` (bukan aritmetika string/BigInt/Decimal murni), perlu diwaspadai jika di masa depan muncul angka sangat besar/pecahan presisi tinggi; disarankan migrasi ke `Decimal` bila diperlukan.
3. **Proteksi Diskon:** Nilai diskon diproteksi agar tidak negatif maupun melebihi subtotal baris (`applied_discount = Math.min(discount, gross)`).

---

## 5. Evaluasi Definition of Done (DoD) & Batas Baris Kode

Pemeriksaan jumlah **baris non-kosong** pada berkas `src/components/penawaran/` dan `src/lib/services/` (seluruh berkas tetap `< 300` baris):
- `calculation.service.ts`: 192 baris *(baris non-kosong — Lulus)*
- `quotation.service.ts`: 256 baris *(baris non-kosong — Lulus)*
- `QuotationItemTable.tsx`: 185 baris *(baris non-kosong — Lulus)*
- `QuotationDetailInfoCard.tsx`: 181 baris *(baris non-kosong — Lulus)*
- `QuotationTable.tsx`: 138 baris *(baris non-kosong — Lulus)*
- **Strict TypeScript & Linter:** Tidak ada tipe `any`, `npm run lint` exit 0.
- **Bebas Ikon Terlarang:** 100% bebas dari ikon keyboard fisik dan logo Gemini.

---

## 6. Status Sign-off & Follow-up Integrasi

- **`PRO-48` (Kalkulasi Backend) & `PRO-49` (API Quotation):** **VERIFIED $\rightarrow$ Done**
- **`PRO-50` (Konversi Invoice):** **FOLLOW-UP** — Migrasi route dari `/api/v1/quotations/[id]/convert` (*in-memory*) ke `/api/m4/v1/quotations/[id]/convert` (Prisma DB + buat `orders` sesuai `U-04`).
- **`PRO-52` (FE Penawaran):** **VERIFIED WITH NOTE** — Aktifkan input/kalkulasi PPN 11% pada `src/app/penawaran/tambah/page.tsx:137` (saat ini masih `taxAmount = 0`).
- **`PRO-53` (FE Invoice):** **FOLLOW-UP** — Implementasi halaman `/invoice` (saat ini masih `<UnderConstructionView>`).
- **`PRO-54` (Verifikasi QA US2):** **VERIFIED (Unit/E2E Baseline Lulus; Item Follow-up Tercatat)**.
