// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-tester mot Transportplattformen.
 *
 * Lokal dev (default):
 *   npm run e2e        # backend på :3001, frontend på :5173
 *
 * Mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   DRIVER_EMAIL=… DRIVER_PASSWORD=… \
 *   COMPANY_EMAIL=… COMPANY_PASSWORD=… \
 *   npx playwright test --project=chromium --project=chromium-auth
 *
 * Projekt:
 *   setup         — loggar in en gång och sparar session (kör alltid före auth-tester)
 *   chromium      — publika sidor, registrering (kräver ej inloggning)
 *   chromium-auth — inloggade flöden (beror på setup)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // 1. Auth setup — körs en gång, skapar playwright/.auth/*.json
    {
      name: "setup",
      testMatch: /setup\/auth\.setup\.js/,
      use: { ...devices["Desktop Chrome"] },
    },

    // 2. Publika sidor (smoke, public-pages, register) — kräver ej inloggning
    {
      name: "chromium",
      testIgnore: [/setup\//, /driver-journey/, /company-journey/, /auth\.spec/],
      use: { ...devices["Desktop Chrome"] },
    },

    // 3. Inloggade flöden — beror på setup, specs väljer storageState via test.use()
    {
      name: "chromium-auth",
      testMatch: [/driver-journey\.spec/, /company-journey\.spec/, /auth\.spec/, /driver-full\.spec/, /company-full\.spec/],
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  timeout: 20000,
  expect: { timeout: 8000 },
});
