// @ts-check
/**
 * Auth-setup specifikt för wizard-testning.
 *
 * Skapar ett nyvivt förar-konto med tomt profil (om det inte finns),
 * verifierar e-posten direkt via skriptet och loggar in.
 * Sparar session till playwright/.auth/wizard-driver.json.
 *
 * Kör som dependency för chromium-wizard-projektet.
 */
import { test as setup, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const WIZARD_EMAIL = "e2e-wizard-driver@stp.test";
const WIZARD_PASSWORD = "WizardTest123!";
const WIZARD_NAME = "Wizard Testförare";
const authFile = path.join(process.cwd(), "playwright/.auth/wizard-driver.json");

setup("skapa och verifiera wizard-testkonto", async ({ page }) => {
  // 1. Registrera konto (eller ignorera om det redan finns)
  const regResp = await page.request.post(`${BACKEND_URL}/api/auth/register`, {
    data: {
      email: WIZARD_EMAIL,
      password: WIZARD_PASSWORD,
      role: "DRIVER",
      name: WIZARD_NAME,
    },
  });
  // Acceptera 201 (skapad) eller 409/400 (finns redan)
  if (regResp.status() !== 201 && regResp.status() !== 409 && regResp.status() !== 400) {
    throw new Error(`Registrering misslyckades: ${regResp.status()}`);
  }

  // 2. Sätt emailVerifiedAt via skriptet (idempotent — ok om redan verifierad)
  const serverDir = path.join(process.cwd(), "server");
  try {
    execSync(`node scripts/verify-user-email.js ${WIZARD_EMAIL}`, {
      cwd: serverDir,
      stdio: "pipe",
    });
  } catch (e) {
    // Ignorera om redan verifierad
  }

  // 3. Logga in
  await page.goto("/login");
  await page.getByLabel(/^E-post/i).fill(WIZARD_EMAIL);
  await page.locator('input[type="password"]').first().fill(WIZARD_PASSWORD);
  await page.getByRole("button", { name: /^Logga in$/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // 4. Rensa profilen (om wizarden redirect:ar till /profil, profilen är komplett)
  if (page.url().includes("/profil") || page.url().includes("/onboarding")) {
    // Rensa profil via API så wizarden visas
    const token = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("drivermatch-auth") || "{}").token; } catch { return null; }
    });
    if (token) {
      await page.request.put(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          licenses: [],
          region: "",
          summary: "",
          shouldShowOnboarding: true,
        },
      });
    }
  }

  await page.context().storageState({ path: authFile });
});
