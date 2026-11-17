import { test, expect } from '@playwright/test';

test.describe('Modul 4 - US2: Penawaran (Quotation) & Pembuatan Invoice', () => {
  test.describe.configure({ mode: 'serial' });

  // Skenario 1: Halaman Form Tambah Penawaran & Kalkulasi Subtotal/Total UI
  test('TC-M4US2-01: Form Tambah Penawaran menghitung subtotal otomatis saat item dan kuantitas diisi', async ({ page }) => {
    await page.goto('/penawaran/tambah');
    await expect(page).toHaveURL(/.*\/penawaran\/tambah/);

    const customerSelect = page.locator('#customer');
    await expect(customerSelect).toBeVisible();
    await customerSelect.selectOption({ index: 1 });

    await page.getByRole('button', { name: /tambah item/i }).click();

    const productSelect = page.getByLabel('Pilih produk atau jasa baris 1');
    await expect(productSelect).toBeVisible();
    await productSelect.selectOption({ index: 1 });

    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('2');

    // Verifikasi ringkasan kalkulasi di sidebar tidak lagi Rp 0 setelah item & qty = 2 dipilih.
    // Catatan: src/app/penawaran/tambah/page.tsx saat ini meng-hardcode taxAmount = 0 (PPN 0%),
    // sehingga verifikasi PPN 11% Round-Half-Up dilakukan melalui unit test calculation-service.test.ts.
    await expect(page.getByText('Subtotal bruto')).toBeVisible();
    const estimatedTotal = page.locator('text=Estimasi akhir').locator('..').locator('span').nth(1);
    await expect(estimatedTotal).toBeVisible();
    await expect(estimatedTotal).not.toHaveText('Rp 0');
  });

  // Skenario 2: TC-M4US2-02 (US2-AC2 / TB-02) Proteksi Penawaran Belum Disetujui
  test('TC-M4US2-02: Menolak pembuatan invoice jika penawaran masih berstatus Menunggu Persetujuan', async ({ page }) => {
    // Buka detail penawaran mock berstatus PENDING_APPROVAL (QUO-010)
    await page.goto('/penawaran/lihat/QUO-010');
    await expect(page).toHaveURL(/.*\/penawaran\/lihat\/QUO-010/);
    await expect(page.getByText('Menunggu persetujuan').first()).toBeVisible();

    const createInvoiceBtn = page.getByRole('button', { name: /buat invoice/i });
    await expect(createInvoiceBtn).toBeVisible();

    const alertBanner = page.getByRole('alert').filter({ hasText: 'Invoice belum dapat dibuat' });
    await expect(async () => {
      await createInvoiceBtn.click();
      await expect(alertBanner).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await expect(alertBanner).toContainText('Penawaran belum disetujui');
  });

  // Skenario 3: TC-M4US2-03 & TC-M4US2-04 Alur Persetujuan dan Navigasi ke Halaman Invoice
  test('TC-M4US2-03 & 04: Partner dapat menyetujui penawaran lalu diarahkan ke halaman invoice', async ({ page }) => {
    await page.goto('/penawaran/lihat/QUO-010');
    await expect(page.getByText('Menunggu persetujuan').first()).toBeVisible();

    const approveBtn = page.getByRole('button', { name: /setujui/i });
    await expect(approveBtn).toBeVisible();

    const approvedToast = page.getByRole('heading', { name: 'Penawaran disetujui' });
    await expect(async () => {
      await approveBtn.click();
      await expect(approvedToast).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });

    await expect(page.getByText('Disetujui', { exact: true }).first()).toBeVisible();

    const createInvoiceBtn = page.getByRole('button', { name: /buat invoice/i });
    await createInvoiceBtn.click();

    // Verifikasi navigasi ke /invoice?quotation_id=QUO-010 (halaman /invoice saat ini masih UnderConstructionView)
    await expect(page).toHaveURL(/.*\/invoice\?quotation_id=QUO-010/);
    await expect(page.getByRole('heading', { name: /invoice/i }).first()).toBeVisible();
  });
});
