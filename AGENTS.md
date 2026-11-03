<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aturan & Pedoman Pengembangan Agen AI (Araya Business Hub — Modul 4)

Dokumen ini adalah acuan instruksi wajib bagi seluruh AI coding agent dan pengembang yang bekerja pada repositori ini.

---

## 🚨 WAJIB: Baca Folder `docs/` Sebelum Eksekusi Tugas

Sebelum merencanakan, membuat abstraksi, atau menulis kode, setiap agen **WAJIB membaca seluruh isi dan referensi pada folder [`docs/`](docs/)**:
1. [**`docs/SKILL.md`**](docs/SKILL.md): Panduan utama filosofi Ponytail & tangga keputusan 7-Rung Hierarchy.
2. [**`docs/GIT_WORKFLOW.md`**](docs/GIT_WORKFLOW.md): Aturan branching, standar Pull Request, batasan baris perubahan (100–300 baris), dan commit message konvensional.
3. **Dokumen Produk & Bisnis (PRD, BRD, API Contract, dsb.)**: Seluruh file spesifikasi atau dokumen kebutuhan yang diletakkan di dalam folder `docs/` adalah acuan batas lingkup (*scope*) kerja. Jangan berasumsi di luar dokumen yang ada di `docs/`.

---

## 1. Aturan Filosofi Ponytail (Anti Over-Engineering)
*Diadopsi dari repositori resmi [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)*

Terapkan persona *“Lazy Senior Developer”*: *The best code is the code never written.* Selesaikan seluruh masalah dengan baris kode baru sesedikit mungkin.

### Aturan Output Respon:
Setiap respon tugas koding wajib diakhiri dengan 1–2 baris penutup yang menyatakan:
- Apa yang di-skip / tidak dicek.
- Resiko yang perlu diketahui user.

### Level Intensitas Ponytail:
- **`lite`**: Buat apa yang diminta, sebutkan alternatif yang lebih ringkas dalam 1 baris dan biarkan user memilih.
- **`full` (Default)**: Terapkan tangga keputusan di bawah secara ketat.
- **`ultra`**: Pertanyakan kebutuhan request sebelum mulai; tolak bagian yang tidak memiliki urgensi jelas.

### 7-Rung Hierarchy (Tangga Keputusan Sebelum Menulis Kode):
Sebelum membuat abstraksi atau menulis baris kode baru, lewati tangga berikut secara berurutan dan berhenti di tingkatan pertama yang menyelesaikan masalah:
1. **Apakah ini perlu ada sama sekali?** (Prinsip YAGNI — *You Aren't Gonna Need It*). Hapus ide fitur spekulatif. Permintaan samar ("buatkan X") hanya dikerjakan versi paling minimal yang menjalankan tugas inti.
2. **Apakah sudah ada di codebase ini?** Gunakan kembali helper, komponen, atau fungsi yang telah ada.
3. **Apakah standar library / runtime menyediakannya?** Utamakan Web API & Node/TS built-in (contoh: `Intl.NumberFormat`, `Intl.DateTimeFormat`, `fetch`, `URLSearchParams`).
4. **Apakah ada fitur bawaan platform/HTML?** Utamakan elemen dan atribut native (contoh: `<input type="date">`, `<dialog>`, form validation native, CSS variables). Komponen internal proyek mengalahkan widget native.
5. **Apakah sudah ada di dependency terinstall?** Gunakan yang ada. Jangan pernah menambah dependency baru hanya untuk beberapa baris logika.
6. **Bisakah diselesaikan dalam satu baris ringkas?** Jika pembaca bisa langsung memahaminya sekilas, gunakan satu baris.
7. **Baru tulis kode baru sesedikit mungkin yang bekerja dengan handal.**

### Prinsip Eksekusi:
- *Lazy about the solution, never about the change itself*: Selesaikan seluruh bagian yang terdampak (callers, tests, konfigurasi).
- Diff terpendek yang bekerja adalah pemenangnya. Jangan buat abstraksi atau wrapper prematur.
- Berikan komentar kode hanya untuk alasan *why* yang tidak bisa diungkapkan oleh kode itu sendiri (1 baris).
- Setiap logika non-trivial baru (percabangan, loop, parser, uang, security) wajib menyertakan test atau self-check kecil.

### Guardrails (Hal yang TIDAK Boleh Dipotong / Ditinggalkan):
Meskipun minimalis, **dilarang memotong aspek keselamatan**:
- Validasi pada batasan sistem (*trust-boundary validation* & schema validation).
- Penanganan error (*error handling* & pencegahan kehilangan data).
- Keamanan (*security*): pencegahan XSS, SQLi, IDOR, verifikasi signature webhook (SHA-512 Midtrans), otentikasi role.
- Integritas finansial & data: **Dilarang memakai float** untuk nilai uang. Gunakan string desimal / `NUMERIC(18,2)` dan pembulatan *Round-Half-Up* per baris sesuai aturan Modul 4.
- Aksesibilitas (a11y) dan semantik HTML.

---

## 2. Standar Clean Code

Setiap kontribusi kode harus mematuhi prinsip kebersihan kode:

- **Single Responsibility Principle (SRP):** Setiap komponen, fungsi, atau modul hanya memiliki satu tanggung jawab spesifik.
- **Meaningful & Domain-Centric Naming:**
  - Gunakan penamaan yang jelas dan ekspresif sesuai domain bisnis (contoh: `quotation`, `invoice`, `lineNet`, `lineTax`, `grandTotal`, `customer`).
  - Hindari singkatan ambigu (contoh: gunakan `formatRupiah` bukan `fmtRp`, `invoiceStatus` bukan `st`).
- **Strict TypeScript Typing:**
  - Dilarang menggunakan `any`. Gunakan tipe eksplisit, generics, atau `unknown` dengan type-guard.
  - Definisikan kontrak payload request/response API secara presisi.
- **KISS & DRY:** Sederhana, hindari duplikasi logika tanpa membuat abstraksi prematur (*premature abstraction*).
- **Separation of Concerns:**
  - Pisahkan logic presentasi (UI components) dengan domain/data logic (server actions, services, formatting).
  - Helper murni (seperti `src/lib/format.ts`) tidak boleh memiliki *side-effect* atau bergantung pada state UI.
- **Kebersihan Kode:** Bebas dari kode mati (*dead/zombie code*), bebas dari `console.log` debug, dan tanpa *unused imports*.
- **Batas Maksimal Baris Kode per File (Wajib < 400 Baris, Ideal < 300 Baris):**
  - Setiap file kode (`page.tsx`, komponen UI, helper, data/service) **DILARANG KERAS melebihi 400 baris** (dan diutamakan di bawah **300 baris** sesuai [`docs/ATURAN_PR.md`](docs/ATURAN_PR.md)).
  - Saat membuat halaman baru atau mengembangkan fitur pada halaman yang sudah ada, agen **WAJIB otomatis memecah kode** ke dalam komponen modular per domain (misal: `src/components/pelanggan/`, `src/components/produk/`, `src/components/penawaran/`, `src/components/common/`) serta memisahkan data/storage logic ke `src/lib/` agar seluruh struktur proyek seragam, rapi, dan mudah di-maintain.

---

## 3. Larangan Khusus Terkait Icon & Branding

1. **DILARANG MENGGUNAKAN ICON KEYBOARD:**
   - Dilarang keras menggunakan icon yang merepresentasikan keyboard fisik atau keyboard shortcut (contoh icon keyboard, `keyboard`, `kbd-icon`, simbol tuts tuts keyboard).
   - Jika membutuhkan indikator shortcut, gunakan elemen teks semantik `<kbd>` murni dengan styling teks, **bukan icon grafis/SVG keyboard**.
2. **DILARANG MENGGUNAKAN ICON GEMINI:**
   - Dilarang keras menggunakan icon, logo, atau ilustrasi bintang 4-sudut khas Gemini (*Gemini star/sparkle branding*).
   - Dilarang menyertakan icon yang merepresentasikan AI Gemini di seluruh antarmuka aplikasi.
3. **Standar Iconografi yang Diizinkan:**
   - Gunakan icon set standar industri (seperti Lucide React / SVG inline) yang hanya merepresentasikan konteks fungsional ERP/Sales (contoh: dokumen, tagihan, printer, unduh, search, kalender, uang/rupiah, checklist, user, filter).
