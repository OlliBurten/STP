// @ts-check
/**
 * Publika sidor — ingen inloggning krävs.
 * Kör mot live: PLAYWRIGHT_BASE_URL=https://transportplattformen.se npx playwright test e2e/public-pages.spec.js
 */
import { test, expect } from "@playwright/test";

test.describe("Startsida", () => {
  test("laddar och visar hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Se lediga jobb/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Skapa konto/i }).first()).toBeVisible();
  });

  test("footer innehåller lagliga länkar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Användarvillkor/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Integritetspolicy/i }).first()).toBeVisible();
  });
});

test.describe("Lediga jobb", () => {
  test("laddar jobblistan", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible({ timeout: 8000 });
  });

  test("filterraden visas (selects + Dölj bemanning)", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.locator("select").first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /Dölj bemanning/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Fler filter/i })).toBeVisible();
  });

  test("kan filtrera på CE-körkort", async ({ page }) => {
    await page.goto("/jobb");
    const licenseSelect = page.locator("select").first();
    await licenseSelect.waitFor({ timeout: 8000 });
    await licenseSelect.selectOption("CE").catch(() => {}); // facettdrivet — CE kan saknas i tom lista
    // Aktivt filter visas som chip ("CE-körkort") när valet gick igenom
    if (await licenseSelect.inputValue() === "CE") await expect(page.getByText("Aktiva filter")).toBeVisible();
  });

  test("kan öppna ett jobb", async ({ page }) => {
    await page.goto("/jobb");
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    const count = await page.locator("a[href^='/jobb/']").count();
    if (count === 0) return; // Inga aktiva jobb tillgängliga på live

    await page.locator("a[href^='/jobb/']").first().click();
    await expect(page).toHaveURL(/\/jobb\/.+/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Åkerier", () => {
  test("laddar åkerisökning", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /^Åkerier$/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("sökfält och filter visas", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByPlaceholder(/Sök åkeri/i)).toBeVisible({ timeout: 8000 });
    await expect(page.locator("select").first()).toBeVisible();
  });
});

test.describe("Förare-sidan", () => {
  test("laddar sidan för förare", async ({ page }) => {
    await page.goto("/forare");
    await expect(page).toHaveURL(/\/forare/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("För åkerier-sidan", () => {
  test("laddar landingssidan", async ({ page }) => {
    await page.goto("/for-akerier");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Skyddade routes omdirigerar", () => {
  test("/profil → login", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/foretag/mina-jobb → login", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/meddelanden → login", async ({ page }) => {
    await page.goto("/meddelanden");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/admin → login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login-sida", () => {
  test("visar inloggningsformulär", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/E-post/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Logga in/i })).toBeVisible();
  });

  test("visar felmeddelande vid fel uppgifter", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Endast nödvändiga/i }).click().catch(() => {});
    await page.getByLabel(/E-post/i).fill("ingen@example.com");
    await page.locator('input[type="password"]').fill("felLösenord123");
    await page.getByRole("button", { name: /Logga in/i }).click();
    // Accepterar antingen inloggningsfel ("Fel e-post eller lösenord")
    // eller rate-limit-meddelande ("Too many requests") som giltiga felsvar
    await expect(page.getByText(/fel|ogiltigt|hittades inte|kontrollera|Fel|Too many/i)).toBeVisible({ timeout: 8000 });
  });

  test("Skapa konto går direkt till förarregistrering (B2C-först)", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Endast nödvändiga/i }).click().catch(() => {});
    await page.getByRole("button", { name: /^Skapa konto$/ }).click();
    await expect(page.getByRole("heading", { name: /Skapa förarkonto/i })).toBeVisible();
    // Åkerier når sin registrering via den diskreta korslänken
    await expect(page.getByRole("button", { name: /Registrera företag/i })).toBeVisible();
  });
});

test.describe("Statiska sidor", () => {
  test("användarvillkor laddar", async ({ page }) => {
    await page.goto("/anvandarvillkor");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("integritetspolicy laddar", async ({ page }) => {
    await page.goto("/integritet");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("om oss laddar", async ({ page }) => {
    await page.goto("/om-oss");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("lönekalkylator laddar", async ({ page }) => {
    await page.goto("/lon-kalkylator");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
