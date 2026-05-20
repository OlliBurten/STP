import { test } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/admin.json") });

test("insights tab screenshot", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Insikter/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "e2e/screenshots/insights-empty.png" });

  // Click "Kör nu" to trigger the agent
  await page.getByRole("button", { name: /Kör nu/i }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "e2e/screenshots/insights-triggered.png" });
  console.log("✅ Skärmdumpar sparade");
});
