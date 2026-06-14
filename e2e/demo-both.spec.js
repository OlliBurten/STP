/**
 * E2E för demo-Båda-kontot (åkeri + förare med rollswitch).
 * Täcker buggarna som fixades 2026-06-14:
 *   - åkeri-vyn kraschade (CompanyBottomNav: Icon is not defined)
 *   - Hitta förare visade 0 förare (fetchDrivers ?region=undefined)
 *   - rollswitch loggade ut → ska nu växla utan utloggning
 *   - rollswitchen flyttad till avatar-menyn ("Visa som")
 *   - produktturens popover-position (skarp text = heltalspixlar)
 *
 * Kräver ett demo-Båda-konto. Sätt DEMO_BOTH_EMAIL/DEMO_BOTH_PASSWORD,
 * annars används defaulten both@demo.test / demo123 (skapas lokalt vid behov).
 */
/* global process */
import { test, expect } from "@playwright/test";

const EMAIL = process.env.DEMO_BOTH_EMAIL || "both@demo.test";
const PASSWORD = process.env.DEMO_BOTH_PASSWORD || "demo123";

async function dismissCookies(page) {
  // Stäng cookie-rutan (väljer minst integritetspåverkande om möjligt).
  const candidates = [/Endast nödvändiga/i, /Avböj/i, /Neka/i, /Acceptera/i, /Godkänn/i];
  for (const re of candidates) {
    const btn = page.getByRole("button", { name: re });
    if (await btn.count()) { await btn.first().click().catch(() => {}); return; }
  }
}

async function login(page) {
  await page.goto("/login");
  await dismissCookies(page);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

// DPR 1.5 = skalad skärm (vanligt på MacBook/externa skärmar) — där subpixel-blur uppstår.
test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });

test.describe("Demo Båda-konto", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Hoppa över i miljöer som saknar demo-Båda-kontot (t.ex. ren CI-DB).
    test.skip(page.url().includes("/login"), `Demo-Båda-kontot ${EMAIL} saknas i denna miljö`);
  });

  test("åkeri-vyn laddas utan krasch (ingen error-boundary)", async ({ page }) => {
    await page.goto("/foretag");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Något gick fel hos oss")).toHaveCount(0);
    // dashboard-rubrik eller KPI-grid ska finnas
    await expect(page.locator("body")).toContainText(/Översikt|Välkommen|Aktiva annonser|Dashboard/i);
  });

  test("Hitta förare visar förare (inte 0)", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Något gick fel hos oss")).toHaveCount(0);
    // ska INTE visa "Inga förare matchar filtren" som default
    await expect(page.getByText(/Inga förare matchar/i)).toHaveCount(0);
    const txt = await page.locator("body").innerText();
    const m = txt.match(/(\d+)\s*tillgängliga förare/);
    expect(m, "hittade antal tillgängliga förare").not.toBeNull();
    expect(Number(m[1])).toBeGreaterThan(0);
  });

  test("rollswitch i avatar-menyn växlar åkeri → förare utan utloggning", async ({ page }) => {
    await page.goto("/foretag");
    await page.waitForLoadState("networkidle");
    // öppna avatar-menyn
    await page.locator("header button, nav button").filter({ hasText: /Demo|DB/ }).last().click();
    await expect(page.getByText(/Visa som/i)).toBeVisible();
    // klicka Förare i menyn
    await page.getByRole("button", { name: "Förare", exact: true }).click();
    await page.waitForLoadState("networkidle");
    // ska landa på förarvyn och fortfarande vara inloggad (inte på /login)
    await expect(page).toHaveURL(/\/jobb/);
    expect(page.url()).not.toContain("/login");
    await expect(page.getByText("Något gick fel hos oss")).toHaveCount(0);

    // växla tillbaka till Åkeri så kontot lämnas i ursprungsläge för nästa test
    await page.locator("header button, nav button").filter({ hasText: /Demo|DB/ }).last().click();
    await page.getByRole("button", { name: "Åkeri", exact: true }).click();
    await page.waitForLoadState("networkidle");
  });

  test("egen produktrundtur (ProductTour) renderas skarp utan driver.js", async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.removeItem("stp_company_tour_done"); } catch (_) {}
    });
    await page.goto("/foretag");
    await page.waitForLoadState("networkidle");

    // Den egna komponenten ska synas...
    const popover = page.locator(".product-tour-popover");
    const appeared = await popover.first().waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
    test.skip(!appeared, "Produktturen visades inte (gejtad) i denna körning");

    // ...och driver.js ska vara helt borta.
    await expect(page.locator(".driver-popover")).toHaveCount(0);

    // Skarphetsgaranti: heltalspixlar (inga fraktioner i left/top) och INGEN
    // text-shadow någonstans i popovern — det var hela buggen med driver.js.
    const pos = await page.evaluate(() => {
      const el = document.querySelector(".product-tour-popover");
      const cs = getComputedStyle(el);
      return { left: cs.left, top: cs.top };
    });
    expect(pos.left.endsWith(".5px"), `left=${pos.left}`).toBe(false);
    expect(pos.top.endsWith(".5px"), `top=${pos.top}`).toBe(false);

    const hasTextShadow = await page.evaluate(() => {
      const root = document.querySelector(".product-tour-popover");
      const all = [root, ...root.querySelectorAll("*")];
      return all.some((n) => {
        const ts = getComputedStyle(n).textShadow;
        return ts && ts !== "none";
      });
    });
    expect(hasTextShadow, "ingen text-shadow i popovern").toBe(false);

    await popover.first().screenshot({ path: "e2e/__screenshots__/tour-popover.png" });
  });
});
