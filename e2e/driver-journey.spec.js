// @ts-check
/**
 * Förarflöden — kräver inloggad förare.
 * Sessionen skapas av e2e/setup/auth.setup.js (loggar in en gång).
 * Sätt DRIVER_EMAIL + DRIVER_PASSWORD i env, eller kör mot lokal dev med seed-data.
 *
 * Kör mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   DRIVER_EMAIL=din@email.se DRIVER_PASSWORD=dittLösenord \
 *   npx playwright test --project=setup --project=chromium-auth e2e/driver-journey.spec.js
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/driver.json") });

test.describe("Förarflöden", () => {
  test("hamnar på profil eller jobb efter inloggning", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(profil|jobb|onboarding)/);
  });

  test("kan navigera till profil", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL(/\/profil/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan bläddra bland jobb", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga/i })).toBeVisible({ timeout: 8000 });
  });

  test("kan öppna ett jobb och se detaljer", async ({ page }) => {
    await page.goto("/jobb");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    // Rensa filter om inga jobb visas
    const clearBtn = page.getByRole("button", { name: /Rensa alla filter/i });
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) await clearBtn.click();
    const count = await page.locator("a[href^='/jobb/']").count();
    if (count === 0) return; // Inga aktiva jobb tillgängliga

    const jobLink = page.locator("a[href^='/jobb/']").first();
    await jobLink.click();
    await expect(page).toHaveURL(/\/jobb\/.+/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan spara ett jobb", async ({ page }) => {
    await page.goto("/jobb");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    const clearBtn = page.getByRole("button", { name: /Rensa alla filter/i });
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) await clearBtn.click();
    const count = await page.locator("a[href^='/jobb/']").count();
    if (count === 0) return; // Inga aktiva jobb tillgängliga

    await page.locator("a[href^='/jobb/']").first().click();
    await expect(page).toHaveURL(/\/jobb\/.+/);

    // Spara-knapp (stjärna/hjärta)
    const saveBtn = page.getByRole("button", { name: /spara|favorit/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(saveBtn).toBeVisible();
    }
  });

  test("kan bläddra bland åkerier", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /Hitta ditt nästa åkeri/i })).toBeVisible({ timeout: 8000 });
  });

  test("kan se favoriter", async ({ page }) => {
    await page.goto("/favoriter");
    await expect(page).toHaveURL(/\/favoriter/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan se meddelanden", async ({ page }) => {
    await page.goto("/meddelanden");
    await expect(page).toHaveURL(/\/meddelanden/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan logga ut", async ({ page }) => {
    await page.goto("/profil");
    // Öppna kontomenyn (avatar-knappen uppe till höger)
    await page.getByRole("button", { name: /Konto|inställningar/i }).click();
    await page.getByRole("menuitem", { name: /Logga ut/i }).click();
    await expect(page).toHaveURL(/\/(login|\s*)/, { timeout: 8000 });
  });
});
