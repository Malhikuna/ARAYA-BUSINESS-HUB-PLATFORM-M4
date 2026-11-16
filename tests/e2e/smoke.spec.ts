import { test, expect } from '@playwright/test';

test.describe('PRO-218: Baseline Smoke Test & Panduan UI Bersama M4', () => {
  test('Halaman Katalog Produk dapat diakses dengan layout standar', async ({ page }) => {
    await page.goto('/produk');
    await expect(page).toHaveURL(/.*\/produk/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Halaman Pelanggan dapat diakses dengan layout standar', async ({ page }) => {
    await page.goto('/pelanggan');
    await expect(page).toHaveURL(/.*\/pelanggan/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Halaman Penawaran & Invoice dapat diakses dengan layout standar', async ({ page }) => {
    await page.goto('/penawaran');
    await expect(page).toHaveURL(/.*\/penawaran/);
    await page.goto('/invoice');
    await expect(page).toHaveURL(/.*\/invoice/);
  });

  test('UI-09: Halaman utama pada lebar 400px tidak memiliki horizontal scroll berlebih', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/produk');
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
