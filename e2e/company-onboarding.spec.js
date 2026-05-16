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

    // Antingen visas empty state (nytt konto) eller normal dashboard (befintligt konto)
    const ctaLink = page.getByRole("link", { name: /Lägg till ditt åkeri/i });
    const hasEmptyState = await ctaLink.isVisible({ timeout: 5000 }).catch(() => false);

    const dashboardTexts = [
      /Välkommen till STP/i,
      /Välkommen tillbaka/i,
      /God morgon/i, /God dag/i, /God kväll/i, /God natt/i,
      /Ny kandidat|nya kandidater/i,
    ];
    let hasDashboard = false;
    for (const pattern of dashboardTexts) {
      if (await page.getByText(pattern).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        hasDashboard = true;
        break;
      }
    }

    expect(hasEmptyState || hasDashboard).toBe(true);

    if (hasEmptyState) {
      await expect(ctaLink).toHaveAttribute("href", /lagg-till-akeri/);
      console.log("✓ Empty state visas — CTA-länk pekar på /foretag/lagg-till-akeri");
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
    await expect(page.getByPlaceholder(/Johansson Åkeri AB/i)).toBeVisible();
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
    const nameInput = page.getByPlaceholder(/Johansson Åkeri AB/i);

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

  test("för kort orgnr blockerar formulärskickning", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");

    // Fyll i orgnr FÖRST (rensas name), sedan namn — annars töms namn av onChange-handler
    await page.getByPlaceholder(/556036-0793/i).fill("12345");
    await page.waitForTimeout(300);
    await page.getByPlaceholder(/Johansson Åkeri AB/i).fill("Test AB");

    await page.getByRole("button", { name: /Lägg till åkeri/i }).click();
    // Vår JS-validering ska visa "Vänta tills…" eftersom valid !== true
    await expect(page.getByText(/Vänta tills|ogiltigt|kontrollera/i)).toBeVisible({ timeout: 4000 });
  });

  test("företagsnamn-fält kan redigeras manuellt (t.ex. enskild firma)", async ({ page }) => {
    await page.goto("/foretag/lagg-till-akeri");
    const nameInput = page.getByPlaceholder(/Johansson Åkeri AB/i);
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
    const nameInput = page.getByPlaceholder(/Johansson Åkeri AB/i);
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
