// @ts-check
import { test, expect } from "@playwright/test";

const ts = Date.now();

test("åkeri kan registrera utan org-nummer", async ({ page }) => {
  await page.goto("/login");

  // Gå till valpskärmen via "Skapa konto gratis"-knappen
  await page.getByRole("button", { name: "Skapa konto gratis", exact: true }).click();

  // Välj åkeri
  await page.getByRole("button", { name: /Registrera som åkeri/i }).click();

  await page.getByLabel(/namn/i).first().fill("Test Åkeri E2E");
  await page.getByLabel(/e-post/i).fill(`e2e-akeri-${ts}@example.com`);
  await page.locator('#password').fill("TestPassword123!");

  // Godkänn villkoren
  await page.locator('input[type="checkbox"]').check();

  await page.getByRole("button", { name: /Skapa företagskonto/i }).click();

  // Ska inte se org-nummer-felet
  await expect(page.getByText(/organisationsnumret används redan/i)).not.toBeVisible({ timeout: 5000 });

  // Ska visa bekräftelse att kontot skapades
  await expect(page.getByText(/kontot skapades/i)).toBeVisible({ timeout: 10000 });
});
