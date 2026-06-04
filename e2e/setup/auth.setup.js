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
  await page.locator('input[type="password"]').first().fill(DRIVER_PASSWORD);
  await page.getByRole("button", { name: /Logga in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // Hantera förare-onboarding om den visas (alla 5 steg)
  const onboardingHeading = page.getByRole("heading", { name: /Vad söker du/i });
  if (await onboardingHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Step 0: Mål — välj Jobb + Heltid
    await page.getByRole("button", { name: /Jobb/i }).first().click();
    await page.getByRole("button", { name: /Heltid Fast anställning/i }).click();
    await page.getByRole("button", { name: /Kom igång/i }).click();

    // Step 1: Kontakt — namn + telefon
    await page.getByRole("heading", { name: /kontaktuppgifter/i }).waitFor({ timeout: 8000 });
    const nameInput = page.locator('input[type="text"]').first();
    const currentName = await nameInput.inputValue();
    if (!currentName || currentName.trim().length < 2) {
      await nameInput.fill("Test Förare");
    }
    const phoneInput = page.getByPlaceholder(/0701234567/i);
    await phoneInput.fill("0701234567");
    await page.getByRole("button", { name: /Nästa/i }).click();

    // Step 2: Körkort + region + ort
    await page.getByRole("heading", { name: /Körkort/i }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: "CE" }).click();
    // Välj region Stockholm
    await page.locator('button', { hasText: "Stockholm" }).first().click();
    // Fyll ort
    const locationInput = page.getByPlaceholder(/Malmö/i);
    await locationInput.fill("Stockholm");
    await page.getByRole("button", { name: /Nästa/i }).click();

    // Step 3: Erfarenhet — hoppa över
    await page.getByRole("button", { name: /Lägg till senare/i }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: /Lägg till senare/i }).click();

    // Step 4: Presentation — fyll sammanfattning och spara
    await page.getByRole("heading", { name: /sekunder/i }).waitFor({ timeout: 8000 });
    const textarea = page.locator("textarea").first();
    await textarea.fill("Erfaren CE-chaufför med fem års erfarenhet av fjärrkörning och distribution. Söker fast heltid i Stockholm med dagtider.");
    // Vänta på att AI-analys ska slutföras (max 12 sek)
    await page.locator("text=Granskar din text").waitFor({ timeout: 3000 }).catch(() => {});
    await page.locator("text=Granskar din text").waitFor({ state: "hidden", timeout: 12000 }).catch(() => {});
    await page.getByRole("button", { name: /Skapa min profil/i }).click();

    // Vänta på redirect till /profil
    await page.waitForURL(/\/profil/, { timeout: 15000 }).catch(() => {});
  }

  await page.context().storageState({ path: driverAuthFile });
});

setup("autentisera som åkeri", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/E-post/i).fill(COMPANY_EMAIL);
  await page.locator('input[type="password"]').first().fill(COMPANY_PASSWORD);
  await page.getByRole("button", { name: /Logga in/i }).click();
  // Ska landa på /foretag direkt — ingen onboarding-wizard längre
  await expect(page).toHaveURL(/\/foretag/, { timeout: 15000 });
  await page.context().storageState({ path: companyAuthFile });
});
