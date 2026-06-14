/**
 * Product tour tests — förare och åkeri.
 * Egen ProductTour-komponent (ersatte driver.js).
 */
import { test, expect } from "@playwright/test";
import path from "path";

const driverAuth = path.join(process.cwd(), "playwright/.auth/driver.json");
const companyAuth = path.join(process.cwd(), "playwright/.auth/company.json");

test.describe("Förare — product tour", () => {
  test.use({ storageState: driverAuth });

  test.beforeEach(async ({ page }) => {
    await page.goto("/jobb");
    await page.evaluate(() => localStorage.removeItem("stp_driver_tour_done"));
  });

  test("touren startar automatiskt på /jobb", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".product-tour-title")).toContainText("Välkommen");
    // driver.js ska vara helt borta
    await expect(page.locator(".driver-popover")).toHaveCount(0);
    await page.screenshot({ path: "e2e/screenshots/tour-driver-step1.png" });
  });

  test("kan klicka igenom alla steg", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 5000 });

    for (let i = 0; i < 5; i++) {
      await page.locator(".product-tour-next").click();
      await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 3000 });
    }

    await expect(page.locator(".product-tour-next")).toContainText("Klar");
    await page.screenshot({ path: "e2e/screenshots/tour-driver-laststep.png" });
    await page.locator(".product-tour-next").click();
    await expect(page.locator(".product-tour-popover")).not.toBeVisible({ timeout: 3000 });
  });

  test("visas inte igen efter att den stängts", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 5000 });
    await page.locator(".product-tour-close").click();
    await expect(page.locator(".product-tour-popover")).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator(".product-tour-popover")).not.toBeVisible();
  });

  test("kan starta om guiden från Inställningar", async ({ page }) => {
    await page.goto("/installningar");
    await expect(page.locator("text=Starta om guiden")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/tour-driver-settings.png" });
  });
});

test.describe("Åkeri — product tour", () => {
  test.use({ storageState: companyAuth });

  test.beforeEach(async ({ page }) => {
    await page.goto("/foretag");
    await page.evaluate(() => localStorage.removeItem("stp_company_tour_done"));
  });

  test("touren startar automatiskt på /foretag", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".product-tour-title")).toContainText("Välkommen");
    await expect(page.locator(".driver-popover")).toHaveCount(0);
    await page.screenshot({ path: "e2e/screenshots/tour-company-step1.png" });
  });

  test("kan klicka igenom alla steg", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 5000 });

    for (let i = 0; i < 7; i++) {
      await page.locator(".product-tour-next").click();
      await expect(page.locator(".product-tour-popover")).toBeVisible({ timeout: 3000 });
    }

    await expect(page.locator(".product-tour-next")).toContainText("Klar");
    await page.screenshot({ path: "e2e/screenshots/tour-company-laststep.png" });
    await page.locator(".product-tour-next").click();
    await expect(page.locator(".product-tour-popover")).not.toBeVisible({ timeout: 3000 });
  });

  test("kan starta om guiden från Inställningar", async ({ page }) => {
    await page.goto("/installningar");
    await expect(page.locator("text=Starta om guiden")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/tour-company-settings.png" });
  });
});
