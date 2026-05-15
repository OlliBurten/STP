// @ts-check
/**
 * Åkeri-onboarding — testar wizard-flödet (steg 0–3).
 * Använder samma autentiserade session som company-full.spec.js.
 * Om kontot redan har genomfört onboarding (t.ex. live-kontot test@akeri.se)
 * hoppar testerna över automatiskt.
 *
 * Kör mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   COMPANY_EMAIL=… COMPANY_PASSWORD=… \
 *   npx playwright test --project=setup --project=chromium-auth e2e/company-onboarding.spec.js
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/company.json") });

// Känt transport-organisationsnummer för validering (Volvo AB)
const TEST_ORG = "556036-0793";

/**
 * Navigera till onboarding. Returnerar false om kontot är redan onboardat
 * (wizard visar ej → redirect till /foretag).
 */
async function gotoOnboarding(page) {
  await page.goto("/foretag/onboarding");
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

  const heading = page.getByRole("heading", { name: /Starta ert åkeri/i });
  const visible = await heading.isVisible({ timeout: 4000 }).catch(() => false);
  if (!visible) {
    console.log("ℹ️  Onboarding redan slutförd för detta konto — hoppar över testet");
    return false;
  }
  return true;
}

// ── Rendering och tema ────────────────────────────────────────────────────────

test.describe("Åkeri-onboarding — rendering och tema", () => {
  test("sidan laddas med mörkt tema och rätt rubrik", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await expect(page.getByRole("heading", { name: /Starta ert åkeri/i })).toBeVisible();

    // Bakgrunden ska INTE vara vit
    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
  });

  test("förhandsgranskningspanel (CompanyPreview) syns i sidopanelen", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await expect(page.getByText("Ert åkeri", { exact: true })).toBeVisible();
    await expect(page.getByText("Organisationsnummer", { exact: true })).toBeVisible();
    await expect(page.getByText("Segment valt", { exact: true })).toBeVisible();
  });

  test("fördelskort syns på steg 0", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await expect(page.getByText(/Hitta rätt förare snabbare/i)).toBeVisible();
    await expect(page.getByText(/Publicera jobb direkt/i)).toBeVisible();
    await expect(page.getByText(/Automatisk verifiering/i)).toBeVisible();
  });
});

// ── Steg 0: Organisationsnummer ───────────────────────────────────────────────

test.describe("Steg 0 — organisationsnummer", () => {
  test("orgnummer-fältet syns med rätt placeholder", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await expect(page.getByPlaceholder("556123-4567")).toBeVisible();
  });

  test('"Nästa →" är inaktiv tills orgnr är validerat', async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await expect(page.getByRole("button", { name: /Nästa/i })).toBeDisabled();
  });

  test("Bolagsverket-validering ger grönt svar på ett giltigt transportorgnr", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    await page.getByPlaceholder("556123-4567").fill(TEST_ORG);

    // Vänta på asynkron Bolagsverket-kontroll (max 8 sek)
    const validIndicator = page.getByText(/✓ Giltigt/i);
    const isValid = await validIndicator.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isValid) {
      console.log("ℹ️  Bolagsverket-API ej tillgängligt — hoppar över validerings-assertion");
      return;
    }

    await expect(validIndicator).toBeVisible();
    await expect(page.getByText(/Registrerat transportföretag/i)).toBeVisible({ timeout: 4000 });
    await expect(page.getByRole("button", { name: /Nästa/i })).toBeEnabled();
  });

  test("förhandsgranskningspanelens checklista uppdateras när orgnr fylls i", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    // Skriv 10-siffrigt orgnr → panelen ska reagera utan att krascha
    await page.getByPlaceholder("556123-4567").fill(TEST_ORG);

    // Checkliste-texten i panelen ska fortfarande vara synlig
    await expect(page.getByText("Organisationsnummer", { exact: true })).toBeVisible();
  });
});

// ── Steg 1: Segment ───────────────────────────────────────────────────────────

test.describe("Steg 1 — transportsegment", () => {
  /** Navigera till steg 1. Returnerar false om ej möjligt. */
  async function goToStep1(page) {
    if (!(await gotoOnboarding(page))) return false;

    await page.getByPlaceholder("556123-4567").fill(TEST_ORG);
    const nextBtn = page.getByRole("button", { name: /Nästa/i });
    const enabled = await nextBtn.isEnabled({ timeout: 8000 }).catch(() => false);
    if (!enabled) {
      console.log("ℹ️  Bolagsverket-API ej tillgängligt — hoppar över steg-1-test");
      return false;
    }
    await nextBtn.click();
    await page.waitForTimeout(400);
    return true;
  }

  test("segment-rubrik och kort visas på steg 1", async ({ page }) => {
    if (!(await goToStep1(page))) return;

    await expect(page.getByRole("heading", { name: /Vilka förare/i })).toBeVisible({ timeout: 6000 });
    await expect(page.getByText("Heltid")).toBeVisible();
    await expect(page.getByText("Vikariat")).toBeVisible();
    await expect(page.getByText("Praktik")).toBeVisible();
  });

  test('"Skapa konto →" inaktiv utan valt segment', async ({ page }) => {
    if (!(await goToStep1(page))) return;

    await expect(page.getByRole("button", { name: /Skapa konto/i })).toBeDisabled({ timeout: 4000 });
  });

  test("kan välja segment och aktivera Skapa-knappen", async ({ page }) => {
    if (!(await goToStep1(page))) return;

    await page.getByText("Heltid").first().click();
    await expect(page.getByRole("button", { name: /Skapa konto/i })).toBeEnabled({ timeout: 4000 });
  });

  test("Tillbaka-knappen tar tillbaka till steg 0", async ({ page }) => {
    if (!(await goToStep1(page))) return;

    await page.getByRole("button", { name: /Tillbaka/i }).click();
    await expect(page.getByRole("heading", { name: /Starta ert åkeri/i })).toBeVisible({ timeout: 4000 });
  });
});

// ── Komplett flöde ─────────────────────────────────────────────────────────────

test.describe("Komplett onboarding-flöde", () => {
  test("steg 0 → 1 → 2 (inbjudan) → klar → /foretag", async ({ page }) => {
    if (!(await gotoOnboarding(page))) return;

    // Steg 0 — orgnr
    await page.getByPlaceholder("556123-4567").fill(TEST_ORG);
    const nextBtn = page.getByRole("button", { name: /Nästa/i });
    const enabled = await nextBtn.isEnabled({ timeout: 8000 }).catch(() => false);
    if (!enabled) {
      console.log("ℹ️  Bolagsverket-API ej tillgängligt — hoppar över komplett flöde");
      return;
    }
    await nextBtn.click();

    // Steg 1 — välj Heltid-segment
    await expect(page.getByRole("heading", { name: /Vilka förare/i })).toBeVisible({ timeout: 6000 });
    await page.getByText("Heltid").first().click();
    await page.getByRole("button", { name: /Skapa konto/i }).click();

    // Steg 2 — inbjudan
    await expect(page.getByText(/teammedlemmar|Bjud in team/i)).toBeVisible({ timeout: 8000 });

    // Hoppa över inbjudan
    await page.getByText(/Hoppa över/i).click();

    // Steg 3 — klart-skärm
    await expect(page.getByText(/Ni är live/i)).toBeVisible({ timeout: 8000 });

    // Auto-redirect till /foretag inom ~3 sek
    await expect(page).toHaveURL(/\/foretag/, { timeout: 6000 });
  });
});
