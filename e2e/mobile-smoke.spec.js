// Mobil-rök-test: verifierar att den publika mobil-UI:n faktiskt monterar och
// renderar riktigt innehåll på en mobil-viewport (iPhone). Täcker luckan att
// preview-miljön inte kan emulera 768px-brytpunkten.
//
// Kör mot valfri miljö:  PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
//   npx playwright test e2e/mobile-smoke.spec.js --project=mobile
import { test, expect, devices } from "@playwright/test";

// Pixel 7 = Chromium-motor (samma som suiten) → ingen extra browser-nedladdning.
test.use({ ...devices["Pixel 7"] });

test.describe("Mobil publik UI (rök-test)", () => {
  test("landningssidan renderar hero + CTA på mobil", async ({ page }) => {
    await page.goto("/");
    // Sidan ska montera (inte vit skärm) och ha en registrera/skapa-konto-väg.
    await expect(page.locator("body")).toBeVisible();
    const cta = page.getByRole("link", { name: /skapa|kom igång|registrera|förare/i })
      .or(page.getByRole("button", { name: /skapa|kom igång|registrera|förare/i }));
    await expect(cta.first()).toBeVisible({ timeout: 15000 });
  });

  test("gäst-jobblistan visar jobb på mobil", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.locator("body")).toBeVisible();
    // Riktigt innehåll ska synas (ej vit/tom skärm).
    await expect(
      page.getByText(/jobb|ansök|förare|chaufför|distribution|fjärr|sök/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("inloggning/registrering renderar mobil-auth", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/logga in|skapa konto|e-post|välkommen/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});
