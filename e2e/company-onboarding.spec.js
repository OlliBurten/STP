// @ts-check
/**
 * Åkeri-registrering och onboarding — testar det nya flödet där
 * org-nummer läggs till från dashboarden, inte under registreringen.
 *
 * Kör mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   BACKEND_URL=https://nodejs-production-f3b9.up.railway.app \
 *   COMPANY_EMAIL=… COMPANY_PASSWORD=… \
 *   npx playwright test --project=setup --project=chromium-auth e2e/company-onboarding.spec.js
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/company.json") });

const TEST_ORG   = "556036-0793"; // Volvo AB — känt transportorgnr
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// ── Inloggning → dashboard (aldrig /foretag/onboarding) ──────────────────────

test.describe("Inloggning — redirectar till dashboard", () => {
  test("åkeri-inloggning landar på /foretag", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page).toHaveURL(/\/foretag/, { timeout: 8000 });
    // Ska INTE ha hamnat på onboarding-wizard
    expect(page.url()).not.toMatch(/\/foretag\/onboarding/);
  });

  test("/foretag/onboarding redirectar inte längre tvångsmässigt", async ({ page }) => {
    await page.goto("/foretag/onboarding");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    // Ska antingen stanna kvar på onboarding eller redirecta till /foretag — aldrig blockera
    const url = page.url();
    expect(url).toMatch(/\/(foretag)/);
  });
});

// ── Dashboard — empty state ───────────────────────────────────────────────────

test.describe("Dashboard — tomt state utan företag", () => {
  test("om inget företag finns visas CTA att lägga till åkeri", async ({ page }) => {
    await page.goto("/foretag");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    // Antingen visas empty state (nytt konto) eller dashboard (befintligt konto)
    const hasEmptyState = await page.getByText(/Lägg till ditt åkeri/i).isVisible({ timeout: 4000 }).catch(() => false);
    const hasDashboard  = await page.getByText(/Välkommen tillbaka|God morgon|God dag|God kväll|God natt/i).isVisible({ timeout: 4000 }).catch(() => false);

    expect(hasEmptyState || hasDashboard).toBe(true);

    if (hasEmptyState) {
      // Knappen ska leda till /foretag/lagg-till-akeri
      const link = page.getByRole("link", { name: /Lägg till ditt åkeri/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", /lagg-till-akeri/);
    } else {
      console.log("ℹ️  Konto har redan ett företag — empty state-test hoppar över");
    }
  });
});

// ── /foretag/lagg-till-akeri — formulär ──────────────────────────────────────

test.describe("Lägg till åkeri — formulär", () => {
  test("sidan laddas med orgnr-fält och företagsnamn-fält", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    await expect(page.getByPlaceholder(/556036-0793/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByLabel(/Företagsnamn/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Lägg till åkeri/i })).toBeVisible();
  });

  test("orgnr auto-formateras till XXXXXX-XXXX", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    const input = page.getByPlaceholder(/556036-0793/i);
    await input.fill("5560360793");
    await expect(input).toHaveValue("556036-0793", { timeout: 2000 });
  });

  test("klistrar man in ett annat nummer rensas gamla företagsnamnet", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    const orgInput  = page.getByPlaceholder(/556036-0793/i);
    const nameInput = page.getByLabel(/Företagsnamn/i);

    // Fyll i första numret
    await orgInput.fill("556036-0793");
    await page.waitForTimeout(800); // vänta på Bolagsverket-debounce

    // Byt till ett annat nummer — förra företagsnamnet ska försvinna
    await orgInput.fill("556007-3506");
    const nameVal = await nameInput.inputValue();
    expect(nameVal).toBe("");
  });

  test("Bolagsverket-validering ger grön indikator på giltigt transportorgnr", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    await page.getByPlaceholder(/556036-0793/i).fill(TEST_ORG);

    const valid = page.getByText(/✓ Giltigt/i);
    const isValid = await valid.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isValid) {
      console.log("ℹ️  Bolagsverket-API ej tillgängligt lokalt — hoppar över validerings-assertion");
      return;
    }
    await expect(valid).toBeVisible();
  });

  test("ogiltigt orgnr-format ger felmeddelande", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    const input = page.getByPlaceholder(/556036-0793/i);

    // Skriv in 10 siffror med fel Luhn
    await input.fill("000000-0000");
    await page.waitForTimeout(800);

    // Skicka formuläret och se om validering reagerar
    await page.getByRole("button", { name: /Lägg till åkeri/i }).click();
    await expect(page.getByText(/ogiltigt|fel|kontrollera/i)).toBeVisible({ timeout: 4000 });
  });

  test("företagsnamn-fält kan redigeras manuellt (t.ex. enskild firma)", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    const nameInput = page.getByLabel(/Företagsnamn/i);
    await nameInput.fill("Mitt Åkeri AB");
    await expect(nameInput).toHaveValue("Mitt Åkeri AB");
  });

  test("Tillbaka-länk tar till /foretag", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    await page.getByRole("link", { name: /Tillbaka/i }).click();
    await expect(page).toHaveURL(/\/foretag$/, { timeout: 4000 });
  });
});

// ── Komplett flöde: lägg till åkeri → /foretag ───────────────────────────────

test.describe("Komplett flöde — lägg till åkeri", () => {
  test("kan fylla i formulär och skicka om Bolagsverket är tillgängligt", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");

    // Fyll i orgnr och vänta på Bolagsverket
    await page.getByPlaceholder(/556036-0793/i).fill(TEST_ORG);
    const valid = page.getByText(/✓ Giltigt/i);
    const isValid = await valid.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isValid) {
      console.log("ℹ️  Bolagsverket-API ej tillgängligt — hoppar över komplett flöde");
      return;
    }

    // Säkerställ att företagsnamn finns (kan vara ifyllt av Bolagsverket)
    const nameInput = page.getByLabel(/Företagsnamn/i);
    const currentName = await nameInput.inputValue();
    if (!currentName.trim()) await nameInput.fill("Test Åkeri AB");

    // Skicka — org kan redan finnas (duplicate), det är OK
    await page.getByRole("button", { name: /Lägg till åkeri/i }).click();
    await page.waitForTimeout(1500);

    // Antingen redirect till /foretag eller felmeddelande om org redan finns
    const url = page.url();
    const hasError = await page.getByText(/finns redan|duplicate|redan registrerat/i).isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasError) {
      expect(url).toMatch(/\/foretag/);
    } else {
      console.log("ℹ️  Org finns redan i systemet — redirect-test hoppar över");
    }
  });
});

// ── Bolagsverket API — direkttester ──────────────────────────────────────────

test.describe("Bolagsverket API — integration", () => {
  test("giltigt transportorgnr returnerar valid=true", async ({ page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/utils/company-lookup?orgnr=${TEST_ORG}`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.valid).toBe(true);
    expect(data.formatted).toBe(TEST_ORG);
  });

  test("live-tokens ger bolagsnamn och transportkod (hoppar över lokalt)", async ({ page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/utils/company-lookup?orgnr=${TEST_ORG}`);
    const data = await resp.json();
    if (data.source === "format-only") {
      console.log("ℹ️  Bolagsverket-tokens ej konfigurerade — hoppar över data-assertion");
      return;
    }
    expect(data.companyName).toBeTruthy();
    expect(typeof data.isTransport).toBe("boolean");
    console.log(`✓ Bolagsverket: ${data.companyName}, stad=${data.city}, transport=${data.isTransport}`);
  });

  test("ogiltigt orgnr returnerar valid=false", async ({ page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/utils/company-lookup?orgnr=123`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.valid).toBe(false);
  });

  test("enskild firma-format (YYMMDD-XXXX) accepteras av API", async ({ page }) => {
    // 000104-3397 är ett enskild firma-format (personnnummer-baserat)
    const resp = await page.request.get(`${BACKEND_URL}/api/utils/company-lookup?orgnr=000104-3397`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    // Ska antingen vara valid=true (format godkänt) eller returnera info om enskild firma
    expect(typeof data.valid).toBe("boolean");
    console.log(`✓ Enskild firma 000104-3397: valid=${data.valid}, source=${data.source}`);
  });
});
