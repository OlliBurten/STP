// @ts-check
import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E-tester som kräver inloggning.
 * Sessionen skapas av e2e/setup/auth.setup.js.
 * Mot lokal dev: använd seed-användare driver@example.com / company@example.com.
 */

const driverAuthFile = path.join(process.cwd(), "playwright/.auth/driver.json");
const companyAuthFile = path.join(process.cwd(), "playwright/.auth/company.json");

test.describe("Inloggad förare", () => {
  test.use({ storageState: driverAuthFile });

  test("når dashboard efter inloggning", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(profil|jobb|onboarding\/forare)/);
  });

  test("kan öppna Jobb-sidan", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible();
  });

  test("kan öppna Åkerier-sidan", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /Hitta ditt nästa åkeri/i })).toBeVisible();
  });

  test("kan logga ut", async ({ page }) => {
    await page.goto("/profil");
    // Öppna kontomenyn (avatar-knappen uppe till höger)
    await page.getByRole("button", { name: /Konto|inställningar/i }).click();
    await page.getByRole("menuitem", { name: /Logga ut/i }).click();
    await expect(page.getByRole("link", { name: "Logga in" }).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Inloggad företag", () => {
  test.use({ storageState: companyAuthFile });

  test("når företagsdashboard efter inloggning", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(foretag|onboarding)/);
  });

  test("kan öppna Mina jobb (eller omdirigeras till onboarding)", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/foretag\/(mina-jobb|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});
