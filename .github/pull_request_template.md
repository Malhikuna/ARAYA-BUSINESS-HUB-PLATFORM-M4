## 📌 Deskripsi Singkat
<!-- Jelaskan secara ringkas APA yang diubah dan MENGAPA perubahan ini dibuat -->

## 🔗 Terkait Task / User Story
- Closes / Relates to: #<!-- Masukkan nomor issue atau ID Story, misal: M4-US1, T-08 -->

## 🛠️ Jenis Perubahan
Pilih salah satu atau lebih dengan tanda `[x]`:
- [ ] 🚀 `feat`: Penambahan fitur / endpoint baru
- [ ] 🐛 `fix`: Perbaikan bug / logic error
- [ ] ⚡ `refactor`: Perbaikan struktur kode (tanpa perubahan fitur)
- [ ] 🧪 `test`: Penambahan / pembaruan test (unit/integration)
- [ ] 📝 `docs`: Dokumentasi, README, atau OpenAPI spec
- [ ] 🔧 `chore`: Konfigurasi dependency, linter, atau CI/CD

---

## 🔍 Detail Perubahan Teknis
<!-- Berikan poin-poin perubahan utama pada kode -->
- 
- 

---

## 🧪 Panduan Pengujian (How to Test)
<!-- Tulis langkah detail agar reviewer dapat menguji perubahan ini di lokal -->
1. Jalankan migrasi / seed (jika ada):
   ```bash
   # contoh: npm run db:migrate / npm run db:seed
   ```
2. Jalankan test suite:
   ```bash
   # contoh: npm run test:unit
   ```
3. Endpoint / UI yang dapat dicoba:
   - Endpoint: `POST /api/v1/...`
   - Payload contoh:
     ```json
     {}
     ```

---

## 📸 Bukti Pengujian (Screenshots / Test Output)
<!-- Tempel screenshot hasil test passed di terminal atau respons API Postman/cURL -->


---

## ✅ Checklist Pra-Review (Definition of Done)
Sebelum meminta review, pastikan:
- [ ] Kode telah melalui *self-review* (tidak ada file sampah, debug log, atau kredensial rahasia).
- [ ] Branch sudah *up-to-date* dengan branch target (`develop`).
- [ ] Seluruh unit test dan linter berjalan sukses (hijau) di lokal.
- [ ] Logika kalkulasi uang mematuhi aturan pembulatan (`ROUND_HALF_UP`) dan presisi desimal tanpa floating point.
- [ ] Dokumentasi terkait (OpenAPI / Swagger / README) sudah diperbarui jika ada perubahan kontrak/skema.
