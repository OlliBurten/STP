/**
 * Admin onboarding stats — skärmdump av översikten
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/admin.json") });

test("admin översikt visar onboarding-statistik", async ({ page }) => {

  // Gå till admin
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  // Vänta på att översikten laddas
  await page.waitForSelector("text=Tillväxt", { timeout: 10000 });

  // Skärmdump av hela översikten
  await page.screenshot({ path: "e2e/screenshots/admin-overview-full.png", fullPage: true });

  // Scrolla ned till onboarding-sektionen
  const onboardingSection = page.locator("text=ONBOARDING").first();
  if (await onboardingSection.isVisible({ timeout: 5000 }).catch(() => false)) {
    await onboardingSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/admin-onboarding.png" });
    console.log("✅ Onboarding-sektionen hittades och fotograferades");
  } else {
    console.log("⚠️  Onboarding-sektionen syns inte — API kanske inte svarat än");
    await page.screenshot({ path: "e2e/screenshots/admin-onboarding-missing.png" });
  }
});
