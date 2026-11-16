import { test, expect } from '@playwright/test';

test.describe('Modul 4 - US2: Penawaran (Quotation) & Pembuatan Invoice', () => {

  // Skenario 1: Halaman Form Tambah Penawaran & Ringkasan Kalkulasi
  test('TC-M4US2-01: Form Tambah Penawaran dapat diakses dan menampilkan komponen kalkulasi', async ({ page }) => {
    await page.goto('/penawaran/tambah', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/.*\/penawaran\/tambah/);
    await expect(page.locator('body')).toBeVisible();

    // Memastikan elemen form utama tersedia
    const customerSelect = page.locator('select, [role="combobox"]').first();
    await expect(customerSelect).toBeVisible();
  });

  // Skenario 2: TC-M4US2-02 (US2-AC2 / TB-02) Proteksi Penawaran Belum Disetujui
  test('TC-M4US2-02: Menolak pembuatan invoice jika penawaran masih berstatus Menunggu Persetujuan', async ({ page }) => {
    // Buka detail penawaran berstatus PENDING_APPROVAL (QUO-010)
    await page.goto('/penawaran/lihat/QUO-010', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/.*\/penawaran\/lihat\/QUO-010/);

    // Pastikan badge berstatus "Menunggu persetujuan"
    await expect(page.getByText('Menunggu persetujuan').first()).toBeVisible();

    // Klik tombol Buat Invoice sebelum disetujui
    const createInvoiceBtn = page.getByRole('button', { name: /buat invoice/i });
    await expect(createInvoiceBtn).toBeVisible();
    await createInvoiceBtn.click();

    // Verifikasi pesan peringatan bahwa penawaran belum disetujui
    const alertBanner = page.getByRole('alert').filter({ hasText: 'Invoice belum dapat dibuat' });
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText('Invoice belum dapat dibuat');
    await expect(alertBanner).toContainText('Penawaran belum disetujui');
  });

  // Skenario 3: TC-M4US2-03 & TC-M4US2-04 Alur Persetujuan dan Konversi ke Invoice
  test('TC-M4US2-03 & 04: Partner dapat menyetujui penawaran lalu membuat invoice', async ({ page }) => {
    await page.goto('/penawaran/lihat/QUO-010', { waitUntil: 'networkidle' });

    // Klik tombol Setujui
    const approveBtn = page.getByRole('button', { name: /setujui/i });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Verifikasi badge berubah menjadi "Disetujui" dan toast muncul
    await expect(page.getByText('Disetujui').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Penawaran disetujui' })).toBeVisible();

    // Sekarang klik tombol Buat Invoice
    const createInvoiceBtn = page.getByRole('button', { name: /buat invoice/i });
    await createInvoiceBtn.click();

    // Verifikasi diarahkan ke halaman invoice dengan parameter quotation_id
    await expect(page).toHaveURL(/.*\/invoice\?quotation_id=QUO-010/);
  });

});
