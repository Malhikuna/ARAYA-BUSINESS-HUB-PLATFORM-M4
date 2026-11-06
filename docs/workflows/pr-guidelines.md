# Panduan Pull Request (The Perfect Pull Request)
## Araya Business Hub Platform — Modul 4: Penawaran & Tagihan Penjualan (Sales)

Dokumen ini menjadi standar resmi pembuatan dan review Pull Request (PR) di repositori ini, diadopsi dari best practice:
👉 **[The Perfect Pull Request: Best Practices for Collaborative Development (DeployHQ)](https://www.deployhq.com/blog/the-perfect-pull-request-best-practices-for-collaborative-development)**

---

## 🎯 Filosofi: PR Sebagai Media Komunikasi & Kualitas

Pull Request bukan sekadar tombol untuk menggabungkan kode, melainkan sarana kolaborasi tim untuk:
1. Menjelaskan **alasan teknis dan konteks bisnis** di balik perubahan kode.
2. Mempermudah rekan tim memahami dan memverifikasi kode dengan cepat.
3. Menjadi arsip dokumentasi teknis jangka panjang yang bisa ditelusuri lewat riwayat git.

---

## 1. Prinsip Utama (Core Principles)

### 1.1 Ukuran PR Kecil & Fokus (Atomic PR)
- **Target ukuran:** Usahakan diff PR berkisar **100 – 300 baris kode** (maksimal 400 baris, di luar file *lock* / file auto-generated).
- **Satu PR = Satu Tujuan:** Jangan menggabungkan dua fitur yang tidak berhubungan dalam satu PR. PR kecil lebih cepat di-review, minim risiko bug terselip, dan mudah di-rollback jika terjadi masalah.

### 1.2 Judul PR yang Jelas (Conventional Commits)
Gunakan format judul yang langsung menjelaskan inti perubahan:
```
<tipe>(<lingkup-opsional>): <deskripsi singkat>
```
**Contoh Tipe:**
- `feat`: Fitur baru (contoh: `feat(auth): add JWT verification middleware`)
- `fix`: Perbaikan bug (contoh: `fix(tax): handle half-up rounding calculation`)
- `docs`: Dokumentasi (contoh: `docs(pr): add pull request guidelines and template`)
- `refactor`: Perapihan kode tanpa mengubah fungsionalitas
- `test`: Penambahan skenario unit / integration test
- `chore`: Perubahan tooling, konfigurasi, atau dependensi

### 1.3 Branch Asal yang Fleksibel
- Untuk memudahkan seluruh anggota tim (termasuk pemula), aturan penamaan branch bebas menggunakan nama masing-masing developer (contoh: `hikmal`, `ikhsan`, `feature-login`, dsb.).
- **Branch Target Penggabungan:** Selalu arahkan PR ke branch **`develop`** (bukan langsung ke `main`).

---

## 2. Struktur Deskripsi PR (DeployHQ Standard)

Setiap kali membuka PR, GitHub akan otomatis memuat template dari [`.github/pull_request_template.md`](../.github/pull_request_template.md). Pastikan Anda mengisi bagian berikut:

| Bagian | Fungsi |
|---|---|
| **📝 What Changed?** | Ringkasan poin-poin fitur, file, atau logika yang diubah. |
| **🎯 Why?** | Konteks mengapa perubahan ini dibuat (tautkan tiket backlog / user story / issue). |
| **🛠️ How (Technical Approach)?** | Penjelasan teknis: algoritma yang dipakai, pola arsitektur, atau library native yang dimanfaatkan. |
| **🧪 How to Test?** | Panduan langkah demi langkah agar reviewer bisa langsung mencoba dan memverifikasi di komputernya. |
| **📊 Test Results & Verification** | Bukti bahwa kode bekerja (output unit test hijau, cURL respons API, atau screenshot). |
| **⚠️ Risks & Breaking Changes** | Potensi efek samping pada fitur lain dan cara rollback jika gagal. |
| **✅ Author Checklist** | Checklist verifikasi mandiri sebelum meminta approval. |

---

## 3. Alur Kerja Sebelum Meminta Review (Author Checklist)

Sebelum meminta teman tim me-review PR Anda, lakukan **Self-Review**:
1. [ ] **Periksa Diff Sendiri:** Pastikan tidak ada `console.log` sisa debug, file sampah, atau secret key / credential database.
2. [ ] **Pastikan Test & Build Hijau:**
   ```bash
   npm test
   npm run lint
   npm run build
   ```
3. [ ] **Branch Up-to-Date:** Pastikan branch Anda sudah sinkron dengan branch `develop` terbaru agar tidak terjadi konflik.

---

## 4. Etika Reviewer (Bagi yang Me-review)

1. **Responsif:** Tinjau PR rekan tim secepatnya agar alur sprint tidak terhambat.
2. **Komentar Konstruktif:**
   - Bedakan masukan wajib/kritis (Blocker) dan saran tambahan (gunakan label `[Suggestion]` atau `[Nitpick]`).
   - Berikan alasan teknis yang jelas jika meminta revisi kode.
3. **Approve:** Segera klik **Approve** jika kriteria pengujian dan kualitas kode sudah terpenuhi.
