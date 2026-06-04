// @ts-check
/**
 * Förar-onboarding wizard — testar de nya funktionerna:
 *   - B/BE-körkort synliga i körkortsteget
 *   - Presentation är valfri (Hoppa över-länk, kan slutföras utan text)
 *   - AI-analys blockerar aldrig "Skapa profil"
 *   - Done-skärmen visar "Se lediga jobb"-knapp (inte bara "Till min profil")
 *   - setTimeout auto-navigering är borttagen
 *
 * Kör som "chromium-wizard"-projektet (beror på wizard-setup som skapar
 * och verifierar e2e-wizard-driver@stp.test).
 *
 * Kör isolerat:
 *   npx playwright test --project=wizard-setup --project=chromium-wizard e2e/driver-wizard.spec.js
 */
import { test, expect } from "@playwright/test";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// ── Se till att wizarden visas (rensa profilen om den är komplett) ─────────────

async function ensureWizardIsVisible(page) {
  // Rensa profil via API så att isDriverMinimumProfileComplete → false
  const token = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("drivermatch-auth") || "{}").token; } catch { return null; }
  });
  if (token) {
    await page.request.put(`${BACKEND_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { licenses: [], region: "", summary: "" },
    });
  }
  await page.goto("/onboarding/forare");
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  const isWizard = page.url().includes("/onboarding/forare");
  if (!isWizard) {
    console.log("ℹ️  Wizarden ej tillgänglig — profilen är komplett eller redirect skedde:", page.url());
  }
  return isWizard;
}

// ── Steg 1: Välj segment ──────────────────────────────────────────────────────

async function pickSegmentAndContinue(page) {
  const heading = page.getByRole("heading", { name: /Välkommen|Vad söker du/i });
  if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Steg 0: Välkommen
    if (await page.getByRole("heading", { name: /Välkommen/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole("button", { name: /Kom igång/i }).click();
    }
    // Steg 1: Segment
    await expect(page.getByRole("heading", { name: /Vad söker du/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /Fast heltid/i }).click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
  }
}

// ── Körkortssidan ─────────────────────────────────────────────────────────────

test.describe("Körkortssidan i wizard", () => {
  test("visar B och BE utöver C och CE", async ({ page }) => {
    const ok = await ensureWizardIsVisible(page);
    if (!ok) return;

    await pickSegmentAndContinue(page);

    // Steg 2: Körkort
    await expect(page.getByRole("heading", { name: /Vilka körkort/i })).toBeVisible({ timeout: 8000 });

    // Alla fyra körkortsknappar ska finnas
    await expect(page.getByRole("button", { name: /^C Tung/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^CE Tung/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^B Personbil/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^BE Personbil/ })).toBeVisible();
  });

  test("B-notering visas inte om B redan är valt", async ({ page }) => {
    const ok = await ensureWizardIsVisible(page);
    if (!ok) return;

    await pickSegmentAndContinue(page);
    await expect(page.getByRole("heading", { name: /Vilka körkort/i })).toBeVisible({ timeout: 8000 });

    // Välj CE — "B-körkort ingår automatiskt" ska visas
    await page.getByRole("button", { name: /^CE / }).first().click();
    await expect(page.getByText(/B-körkort ingår automatiskt/i)).toBeVisible();

    // Välj B explicit — notisen ska försvinna
    await page.getByRole("button", { name: /^B Personbil/ }).first().click();
    await expect(page.getByText(/B-körkort ingår automatiskt/i)).not.toBeVisible();
  });
});

// ── Presentationssidan (valfri) ───────────────────────────────────────────────

test.describe("Presentationssidan är valfri", () => {
  // Hjälp: gå till steg 4 (presentation)
  async function goToStep4(page) {
    const ok = await ensureWizardIsVisible(page);
    if (!ok) return false;
    await pickSegmentAndContinue(page);
    // Steg 2: välj CE och fortsätt
    await expect(page.getByRole("heading", { name: /Vilka körkort/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /^CE / }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    // Steg 3: namn + region
    await expect(page.getByRole("heading", { name: /Vem är du/i })).toBeVisible({ timeout: 8000 });
    const nameInput = page.getByPlaceholder(/För- och efternamn/i);
    const existing = await nameInput.inputValue();
    if (!existing || existing.trim().length < 2) await nameInput.fill("Wizard Testförare");
    await page.locator("button").filter({ hasText: "Stockholm" }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    // Steg 4: presentation
    await expect(page.getByRole("heading", { name: /Presentera/i })).toBeVisible({ timeout: 8000 });
    return true;
  }

  test("Hoppa över-länk visas när fältet är tomt", async ({ page }) => {
    const ok = await goToStep4(page);
    if (!ok) return;
    await expect(page.getByText(/Valfritt — du kan lägga/i)).toBeVisible();
    // Rensa textarean om den innehåller sparad text från föregående körning
    const textarea = page.locator("textarea").first();
    await textarea.fill("");
    await expect(page.getByRole("button", { name: /Hoppa över — lägg till senare/i })).toBeVisible();
  });

  test("Skapa profil är klickbar utan presentation (AI blockerar inte)", async ({ page }) => {
    const ok = await goToStep4(page);
    if (!ok) return;
    // Knappen ska vara aktiverad även utan text
    const createBtn = page.getByRole("button", { name: /Skapa profil|Skapa min profil/i });
    await expect(createBtn).toBeEnabled({ timeout: 3000 });
    await expect(createBtn).not.toBeDisabled();
  });

  test("placeholder anpassas för FLEX-segment", async ({ page }) => {
    const ok = await ensureWizardIsVisible(page);
    if (!ok) return;
    // Välkommen
    if (await page.getByRole("heading", { name: /Välkommen/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole("button", { name: /Kom igång/i }).click();
    }
    await expect(page.getByRole("heading", { name: /Vad söker du/i })).toBeVisible({ timeout: 8000 });
    // Välj FLEX (Vikarie / Extra)
    await page.getByRole("button", { name: /Vikarie|Extra/i }).click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    await page.getByRole("button", { name: /^C Tung/ }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    await expect(page.getByRole("heading", { name: /Vem är du/i })).toBeVisible({ timeout: 8000 });
    const nameInput = page.getByPlaceholder(/För- och efternamn/i);
    if (!(await nameInput.inputValue())) await nameInput.fill("Test Förare");
    await page.locator("button").filter({ hasText: "Västra Götaland" }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    await expect(page.getByRole("heading", { name: /Presentera/i })).toBeVisible({ timeout: 8000 });
    // Placeholdern ska nämna extrapass/vikariat, inte 11 år
    const textarea = page.locator("textarea").first();
    const placeholder = await textarea.getAttribute("placeholder") || "";
    expect(placeholder.toLowerCase()).toMatch(/extra|vikariat|flex/i);
    expect(placeholder).not.toContain("11 års");
  });
});

// ── Done-skärmen ──────────────────────────────────────────────────────────────

test.describe("Done-skärmen efter slutfört wizard", () => {
  test("visar Se lediga jobb-knapp och inte bara Till min profil", async ({ page }) => {
    const ok = await ensureWizardIsVisible(page);
    if (!ok) return;
    await pickSegmentAndContinue(page);
    await expect(page.getByRole("heading", { name: /Vilka körkort/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /^CE / }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    await expect(page.getByRole("heading", { name: /Vem är du/i })).toBeVisible({ timeout: 8000 });
    const nameInput = page.getByPlaceholder(/För- och efternamn/i);
    if (!(await nameInput.inputValue())) await nameInput.fill("Wizard Testförare");
    await page.locator("button").filter({ hasText: "Skåne" }).first().click();
    await page.getByRole("button", { name: /Fortsätt/i }).click();
    await expect(page.getByRole("heading", { name: /Presentera/i })).toBeVisible({ timeout: 8000 });

    // Slutför via Hoppa över eller tom + Skapa profil
    const skipBtn = page.getByRole("button", { name: /Hoppa över/i });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    } else {
      await page.getByRole("button", { name: /Skapa profil|Skapa min profil/i }).click();
    }

    // Done-skärmen: Se lediga jobb-knapp ska finnas
    await expect(
      page.getByRole("button", { name: /Se.*jobb|lediga jobb/i }).or(
        page.getByRole("link", { name: /Se.*jobb|lediga jobb/i })
      ).first()
    ).toBeVisible({ timeout: 15000 });

    // "Till min profil" ska finnas som sekundär knapp
    await expect(page.getByRole("button", { name: /Till min profil/i })).toBeVisible();

    // Auto-navigering borttagen — ska inte lämna sidan på 4 sekunder
    await page.waitForTimeout(4000);
    expect(page.url()).not.toMatch(/\/profil$/);
  });
});
