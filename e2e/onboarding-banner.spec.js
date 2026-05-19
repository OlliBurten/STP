/**
 * Screenshot av onboarding completion-banner på /jobb
 * Kör mot live med förarkontot som har låg profilfyllnad
 */
import { test } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/driver.json") });

test("onboarding banner på /jobb", async ({ page }) => {
  await page.goto("/jobb");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  // Scrolla till toppen av job listings
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  await page.screenshot({ path: "e2e/screenshots/onboarding-banner.png" });
  console.log("✅ Skärmdump sparad");
});
