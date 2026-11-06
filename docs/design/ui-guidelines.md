# Panduan Desain Antarmuka

Dokumen ini menjadi acuan visual dan interaksi untuk antarmuka Araya Business Hub Modul 4. Tujuannya menjaga tampilan konsisten, mudah dipahami, dan dapat digunakan oleh seluruh pengguna aplikasi.

## Prinsip Desain

- Utamakan kejelasan informasi dan alur kerja bisnis.
- Tampilkan aksi utama dengan hierarki visual yang jelas.
- Gunakan pola dan istilah yang konsisten di seluruh halaman.
- Hindari dekorasi yang tidak membantu pengguna menyelesaikan tugas.

## Hindari Tampilan Generik (AI Slop)

- Jangan memakai layout dashboard generik atau pola template secara mentah. Susun halaman berdasarkan tugas dan informasi yang benar-benar dibutuhkan pengguna Modul 4.
- Hindari gradien mencolok, glassmorphism, tumpukan kartu, sudut terlalu membulat, bayangan berlebihan, dan badge dekoratif jika tidak punya fungsi yang jelas.
- Jangan menambahkan ornamen, emoji, ikon dekoratif, atau teks placeholder hanya agar halaman terlihat ramai.
- Gunakan ruang kosong, warna, dan variasi ukuran secara terukur untuk membangun hierarki; setiap elemen visual harus membantu pemahaman atau tindakan pengguna.
- Ikuti prinsip standar koding ([`docs/workflows/coding-standards.md`](../workflows/coding-standards.md)): pilih solusi paling sederhana yang menyelesaikan kebutuhan, dan jangan menambah komponen atau variasi visual spekulatif.

## Fondasi Visual

### Warna dan tema

- Gunakan token CSS yang sudah tersedia di `src/app/globals.css`, seperti `background`, `foreground`, `surface`, `border`, `primary`, dan token status.
- Jangan menulis nilai warna baru langsung di komponen jika token yang ada sudah sesuai. Jika token baru memang dibutuhkan, tambahkan secara terpusat dan dokumentasikan alasannya.
- Antarmuka harus tetap terbaca pada tema terang maupun gelap. Jangan mengandalkan warna saja untuk menyampaikan status atau arti.
- Gunakan warna status (`success`, `warning`, `danger`, dan `info`) sesuai konteksnya.

### Tipografi

- Gunakan **Plus Jakarta Sans** untuk judul dan **Source Sans 3** untuk teks antarmuka, sesuai konfigurasi pada `src/app/layout.tsx`.
- Jaga hierarki ukuran dan ketebalan teks agar judul, label, isi, bantuan, dan nilai penting mudah dibedakan.
- Hindari teks kecil atau kontras rendah untuk informasi penting.

## Tata Letak dan Komponen

- Kelompokkan informasi yang berkaitan dan beri jarak yang cukup antarbagian.
- Gunakan komponen dan pola yang sudah ada sebelum membuat pola baru.
- Pastikan halaman tetap dapat digunakan pada ukuran layar yang berbeda; tabel atau form yang lebar perlu memiliki cara akses yang jelas pada layar kecil.
- Label field harus terlihat dan terhubung secara semantik dengan kontrolnya. Jangan menjadikan placeholder sebagai satu-satunya label.
- Tampilkan status, validasi, dan pesan kesalahan dengan teks yang jelas serta hubungan yang tepat ke elemen terkait.

## Aturan Ikon dan Branding

- **Dilarang menggunakan ikon keyboard fisik atau ikon shortcut keyboard.** Jika perlu menunjukkan shortcut, gunakan teks semantik `<kbd>` tanpa gambar ikon keyboard.
- **Dilarang menggunakan ikon, logo, atau ilustrasi bintang empat sudut khas Gemini** maupun elemen branding Gemini lainnya.
- Pilih ikon yang mewakili fungsi ERP/Sales, seperti dokumen, tagihan, pencarian, kalender, uang, unduh, filter, dan pengguna.
- Ikon dekoratif harus disembunyikan dari teknologi bantu. Ikon yang menyampaikan fungsi harus memiliki nama aksesibel atau teks pendamping.
- Gunakan solusi ikon yang sudah tersedia di proyek. Jangan menambah dependency ikon sebelum kebutuhan dan pilihannya disepakati.

## Aksesibilitas dan Interaksi

- Gunakan elemen HTML semantik dan pastikan semua aksi dapat dioperasikan dengan keyboard.
- Pertahankan indikator fokus yang terlihat.
- Pastikan kontras teks dan kontrol memadai pada kedua tema.
- Tombol dan tautan harus memiliki nama yang menjelaskan tujuannya; jangan mengandalkan ikon saja.
- Berikan umpan balik yang jelas setelah aksi berhasil atau gagal.

## Penerapan Perubahan Desain

- Periksa tampilan pada tema terang dan gelap serta ukuran layar yang relevan.
- Jika perubahan memperkenalkan token atau pola visual baru, perbarui panduan ini agar tetap sesuai dengan implementasi.
- Aturan umum proyek pada `AGENTS.md` tetap berlaku, termasuk batasan ikon dan persyaratan aksesibilitas.
