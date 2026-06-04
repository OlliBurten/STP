// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Startsida (gäst)", () => {
  test("visar rubrik och CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Se lediga jobb/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Logga in" }).first()).toBeVisible();
  });

  test("navigerar till Logga in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Logga in" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Logga in|Registrera/i })).toBeVisible();
  });

  test("navigerar till För förare", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "För förare" }).first().click();
    await expect(page).toHaveURL(/\/forare/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("navigerar till För åkerier", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "För åkerier" }).first().click();
    await expect(page).toHaveURL(/\/for-akerier/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Sida Jobb", () => {
  test("laddar och visar innehåll", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "CE-körkort" })).toBeVisible({ timeout: 10000 });
  });

  test("har snabbfilter för körkort", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("button", { name: "CE-körkort" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "C-körkort" })).toBeVisible();
  });
});

test.describe("Sida Åkerier", () => {
  test("laddar och visar sökfält", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /Hitta ditt nästa åkeri/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/Sök åkeri/i)).toBeVisible();
  });
});

test.describe("Login-sida", () => {
  test("visar inloggningsformulär", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/E-post/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Logga in/i })).toBeVisible();
  });
});

test.describe("Skyddade routes (gäst)", () => {
  test("omdirigerar till login vid besök på /profil", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL(/\/login/);
  });

  test("omdirigerar till login vid besök på /foretag/mina-jobb", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Header och navigation", () => {
  test("header innehåller STP och nav-länkar", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header.getByRole("link", { name: /STP|Sveriges Transportplattform/i })).toBeVisible();
    await expect(header.getByRole("link", { name: "För förare" })).toBeVisible();
    await expect(header.getByRole("link", { name: "För åkerier" })).toBeVisible();
  });

  test("footer innehåller användarvillkor", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Användarvillkor/i }).first()).toBeVisible();
  });
});
