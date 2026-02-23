// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-tester mot DriverMatch. Kräver att backend och frontend körs:
 * - Backend: cd server && npm run dev (port 3001)
 * - Frontend: npm run dev (port 5173)
 * Kör: npm run e2e
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
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  timeout: 15000,
  expect: { timeout: 5000 },
});
