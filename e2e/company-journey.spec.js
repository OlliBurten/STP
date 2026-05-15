// @ts-check
/**
 * Åkeriflöden — kräver inloggat och verifierat åkeri.
 * Sessionen skapas av e2e/setup/auth.setup.js (loggar in en gång).
 * Sätt COMPANY_EMAIL + COMPANY_PASSWORD i env, eller kör mot lokal dev med seed-data.
 *
 * Kör mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   COMPANY_EMAIL=din@akeri.se COMPANY_PASSWORD=dittLösenord \
 *   npx playwright test --project=setup --project=chromium-auth e2e/company-journey.spec.js
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/company.json") });

test.describe("Åkeriflöden", () => {
  test("hamnar på företagsöversikt eller onboarding efter inloggning", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(foretag|onboarding)/);
  });

  test("kan se företagsöversikt", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page).toHaveURL(/\/foretag/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan se mina jobb", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/foretag\/(mina-jobb|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan se chauffördatabasen", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await expect(page).toHaveURL(/\/foretag\/(chaufforer|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan se meddelanden", async ({ page }) => {
    await page.goto("/foretag/meddelanden");
    await expect(page).toHaveURL(/\/foretag\/(meddelanden|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("annonsera-sidan laddar", async ({ page }) => {
    await page.goto("/foretag/annonsera");
    await expect(page).toHaveURL(/\/foretag\/(annonsera|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan öppna skapa-jobb-formuläret", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    const newJobBtn = page.getByRole("button", { name: /nytt jobb|publicera|skapa/i }).first();
    if (await newJobBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newJobBtn.click();
      await expect(page.locator("form, [role='dialog']").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
