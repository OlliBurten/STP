// @ts-check
import { test, expect } from "@playwright/test";

/**
 * E2E-tester som kräver inloggning. Använder seed-användare driver@example.com / password123.
 * Kräver: backend körs med seed (npm run db:seed) och seed sätter emailVerifiedAt så att login fungerar.
 */
test.describe("Inloggad förare", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/E-post/i).fill("driver@example.com");
    await page.getByLabel(/Lösenord/i).fill("password123");
    await page.getByRole("button", { name: /Logga in/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("når profil efter inloggning", async ({ page }) => {
    await expect(page).toHaveURL(/\/(profil|foretag|jobb|onboarding\/forare)/);
    await expect(page.getByText(/Min profil|Översikt|Lediga jobb|Kom igång|onboarding/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("kan öppna Jobb-sidan", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible();
  });

  test("kan öppna Åkerier-sidan", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /Hitta åkerier/i })).toBeVisible();
  });

  test("kan logga ut", async ({ page }) => {
    await page.getByRole("button", { name: /Logga ut/i }).click();
    await expect(page.getByRole("link", { name: "Logga in" }).first()).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Skapa konto" }).first()).toBeVisible();
  });
});

test.describe("Inloggad företag", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/E-post/i).fill("company@example.com");
    await page.getByLabel(/Lösenord/i).fill("password123");
    await page.getByRole("button", { name: /Logga in/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("når företagsöversikt efter inloggning", async ({ page }) => {
    await expect(page).toHaveURL(/\/(foretag|foretag\/mina-jobb)/);
  });

  test("kan öppna Mina jobb", async ({ page }) => {
    await page.getByRole("link", { name: /Mina jobb/i }).first().click();
    await expect(page).toHaveURL(/\/foretag\/mina-jobb/);
    await expect(page.getByRole("heading", { name: /Mina jobb/i })).toBeVisible();
  });
});
