import { test, expect, Page } from '@playwright/test';

async function visitAndVerifyPage(page: Page, path: string, expectedHeading: RegExp) {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  const response = await page.goto(path, { waitUntil: 'networkidle' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole('heading', { name: expectedHeading }).first()).toBeVisible();
  expect(pageErrors).toEqual([]);
}

test.describe('PRO-218: Baseline Smoke Test & Panduan UI Bersama M4', () => {
  test('Halaman Katalog Produk dapat diakses dengan layout standar', async ({ page }) => {
    await visitAndVerifyPage(page, '/produk', /produk/i);
  });

  test('Halaman Pelanggan dapat diakses dengan layout standar', async ({ page }) => {
    await visitAndVerifyPage(page, '/pelanggan', /pelanggan/i);
  });

  test('Halaman Penawaran dapat diakses dengan layout standar', async ({ page }) => {
    await visitAndVerifyPage(page, '/penawaran', /penawaran/i);
  });

  test('Halaman Invoice dapat diakses (status saat ini: UnderConstructionView)', async ({ page }) => {
    // Catatan: halaman /invoice masih menggunakan UnderConstructionView hingga PRO-53/PRO-60 aktif
    await visitAndVerifyPage(page, '/invoice', /invoice/i);
  });

  test('UI-09: Halaman utama pada lebar 400px tidak memiliki horizontal scroll berlebih', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 400px', 'Uji UI-09 khusus dijalankan pada project Mobile 400px');

    const response = await page.goto('/produk', { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('table').first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
