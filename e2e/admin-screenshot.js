/**
 * Öppnar transportplattformen.se, väntar på manuell inloggning,
 * navigerar sedan till /admin och tar skärmdump.
 *
 * Kör med: node e2e/admin-screenshot.js
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, "../playwright/.auth/admin.json");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log("🌐 Öppnar transportplattformen.se/login...");
await page.goto("https://transportplattformen.se/login");

console.log("⏳ Logga in med Google i browsern. Väntar tills du är inne på /admin...");
await page.waitForURL("**/admin**", { timeout: 120000 });

console.log("✅ Inloggad! Sparar session...");
await context.storageState({ path: authFile });

console.log("📸 Tar skärmdump av admin-översikten...");
await page.waitForLoadState("networkidle");
await page.waitForSelector("text=Tillväxt", { timeout: 15000 }).catch(() => {});
await page.screenshot({ path: path.join(__dirname, "screenshots/admin-overview-full.png"), fullPage: true });

const onboarding = page.locator("text=ONBOARDING").first();
const visible = await onboarding.isVisible({ timeout: 5000 }).catch(() => false);
if (visible) {
  await onboarding.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, "screenshots/admin-onboarding.png") });
  console.log("✅ Skärmdump sparad: e2e/screenshots/admin-onboarding.png");
} else {
  console.log("⚠️  Onboarding-sektionen syns inte — Railway kanske inte deployas klart än.");
  await page.screenshot({ path: path.join(__dirname, "screenshots/admin-full-fallback.png") });
  console.log("📸 Full-sida sparad: e2e/screenshots/admin-full-fallback.png");
}

await browser.close();
console.log("✅ Klart!");
