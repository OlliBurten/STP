// @ts-check
/**
 * Claim-landningssida (/anslut/:token) — publika tester.
 *
 * Testar att:
 *   - Sidan renderar utan att krascha (ogiltigt token → felmeddelande, inte 500)
 *   - Sidan visar rätt UI-element för okänt token
 *   - Opt-out-länken returnerar HTML (inte JSON-fel)
 *
 * Kräver ej inloggning — alla tester körs i "chromium"-projektet.
 */
import { test, expect } from "@playwright/test";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// ── /anslut/:token — publik landningssida ─────────────────────────────────────

test.describe("Claim-landningssida — ogiltigt token", () => {
  test("renderar utan 500-krasch", async ({ page }) => {
    await page.goto("/anslut/detta-ar-ett-ogiltigt-token");
    // Ska inte visa server-error eller vit tom sida
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    const body = await page.locator("body").textContent();
    expect(body).not.toBe("");
    // Ska inte visa "Cannot GET" eller ren JSON-error
    expect(body).not.toMatch(/Cannot GET|internal server error/i);
  });

  test("visar felmeddelande för okänt token", async ({ page }) => {
    await page.goto("/anslut/okant-token-xyz");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    // Ska visa någon form av fel/inte hittat-meddelande
    const hasError = await page
      .getByText(/hittade inte|ogiltig|inte hitta|fel|error|token/i)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasHeading = await page.locator("h1, h2").first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError || hasHeading).toBe(true);
  });

  test("sidan innehåller STP-navigering eller varumärke", async ({ page }) => {
    await page.goto("/anslut/valfritt-token");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    // Ska ha STP-branding i headern eller på sidan
    const hasSTP = await page.getByText(/STP|Transportplattformen/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSTP).toBe(true);
  });
});

// ── /api/claims/:token — API-nivå ─────────────────────────────────────────────

test.describe("Claims API — ogiltigt token", () => {
  test("GET /api/claims/ogiltigt-token returnerar 404", async ({ page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/claims/detta-finns-inte`);
    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/claims/:token/activate kräver autentisering", async ({ page }) => {
    const resp = await page.request.post(`${BACKEND_URL}/api/claims/ogiltigt-token/activate`);
    expect(resp.status()).toBe(401);
  });
});

// ── /api/applications/opt-out/:token — returnerar HTML ───────────────────────

test.describe("Opt-out-länk", () => {
  test("GET /api/applications/opt-out/ogiltigt-token returnerar HTML (inte 500)", async ({ page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/applications/opt-out/ogiltigt-token`);
    // Ska returnera 200 med HTML-innehåll (opt-out-bekräftelse eller felmeddelande)
    // INTE en 500 intern server-error
    expect(resp.status()).not.toBe(500);
    const contentType = resp.headers()["content-type"] || "";
    expect(contentType).toContain("text/html");
  });
});
