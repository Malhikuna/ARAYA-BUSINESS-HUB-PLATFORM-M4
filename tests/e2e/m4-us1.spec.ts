import { test, expect } from '@playwright/test';

test.describe('Modul 4 - US1: Input Data Produk/Jasa & Pelanggan', () => {

  // Skenario 1: TC-M4-01 (M4-US1-AC1)
  test('TC-M4-01: Input data produk/pelanggan valid (Berhasil Disimpan)', async ({ page }) => {
    // 1. Buka halaman form tambah produk/pelanggan
    await page.goto('/produk/tambah');

    // 2. Isi form dengan data valid
    await page.fill('input[name="name"]', 'Produk Layanan IT Test');
    await page.selectOption('select[name="category"]', { label: 'Jasa' });
    await page.fill('input[name="price"]', '150000');

    // 3. Klik tombol simpan
    await page.click('button[type="submit"]');
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, simpan' }).click();

    // 4. Verifikasi Hasil yang Diharapkan (AC1)
    // - Muncul notifikasi sukses atau redirect ke halaman tabel produk
    await expect(page).toHaveURL(/\/produk$/);
    await expect(page.locator('table')).toContainText('Produk Layanan IT Test');
  });

  // Skenario 2: TC-M4-02 (M4-US1-AC2)
  test('TC-M4-02: Tolak input data jika tidak lengkap (Peringatan Validasi)', async ({ page }) => {
    // 1. Buka halaman form tambah produk/pelanggan
    await page.goto('/produk/tambah');

    // 2. Kosongkan kolom wajib dan langsung klik simpan
    await page.click('button[type="submit"]');

    // 3. Verifikasi Hasil yang Diharapkan (AC2)
    // - Sistem menolak simpan dan menampilkan pesan error validasi
    const errorMessage = page.locator('.text-red-500, .error-message, [role="alert"]');
    await expect(errorMessage.first()).toBeVisible();
  });

});