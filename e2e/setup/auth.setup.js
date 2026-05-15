// @ts-check
/**
 * Global Playwright setup — loggar in som förare och åkeri en gång,
 * sparar sessionsstate till playwright/.auth/*.json.
 * Återanvänds av driver-journey, company-journey och auth specs
 * för att undvika upprepade inloggningar (rate-limit: 25/15 min).
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const DRIVER_EMAIL = process.env.DRIVER_EMAIL || "driver@example.com";
const DRIVER_PASSWORD = process.env.DRIVER_PASSWORD || "password123";
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "company@example.com";
const COMPANY_PASSWORD = process.env.COMPANY_PASSWORD || "password123";

const driverAuthFile = path.join(process.cwd(), "playwright/.auth/driver.json");
const companyAuthFile = path.join(process.cwd(), "playwright/.auth/company.json");

setup("autentisera som förare", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/E-post/i).fill(DRIVER_EMAIL);
  await page.locator("#password").fill(DRIVER_PASSWORD);
  await page.getByRole("button", { name: /Logga in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.context().storageState({ path: driverAuthFile });
});

setup("autentisera som åkeri", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/E-post/i).fill(COMPANY_EMAIL);
  await page.locator("#password").fill(COMPANY_PASSWORD);
  await page.getByRole("button", { name: /Logga in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.context().storageState({ path: companyAuthFile });
});
