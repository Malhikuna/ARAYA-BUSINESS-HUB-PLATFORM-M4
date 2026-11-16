import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile 400px',
      use: { viewport: { width: 400, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/produk',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
