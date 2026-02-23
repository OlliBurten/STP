// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Startsida (gäst)", () => {
  test("visar rubrik och CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hitta förare\. Hitta jobb/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Skapa konto" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Logga in" }).first()).toBeVisible();
  });

  test("navigerar till Logga in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Logga in" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Logga in|Skapa konto/i })).toBeVisible();
  });

  test("navigerar till Jobb", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Jobb" }).first().click();
    await expect(page).toHaveURL(/\/jobb/);
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible();
  });

  test("navigerar till Åkerier", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Åkerier" }).first().click();
    await expect(page).toHaveURL(/\/akerier/);
    await expect(page.getByRole("heading", { name: /Hitta åkerier/i })).toBeVisible();
  });
});

test.describe("Sida Jobb", () => {
  test("laddar och visar innehåll", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByRole("heading", { name: /Lediga jobb/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Filter" })).toBeVisible({ timeout: 10000 });
  });

  test("har filter för region och bransch", async ({ page }) => {
    await page.goto("/jobb");
    await expect(page.getByLabel(/Region|region/i)).toBeVisible();
    await expect(page.getByLabel(/Bransch|bransch/i)).toBeVisible();
  });
});

test.describe("Sida Åkerier", () => {
  test("laddar och visar filter", async ({ page }) => {
    await page.goto("/akerier");
    await expect(page.getByRole("heading", { name: /Hitta åkerier/i })).toBeVisible();
    await expect(page.getByLabel(/Bransch/i)).toBeVisible();
    await expect(page.getByLabel(/Region|område/i)).toBeVisible();
  });
});

test.describe("Login-sida", () => {
  test("visar inloggningsformulär", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/E-post/i)).toBeVisible();
    await expect(page.getByLabel(/Lösenord/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Logga in|Skapa konto/i })).toBeVisible();
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
  test("header innehåller DriverMatch-logo och nav-länkar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /DriverMatch/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jobb" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Åkerier" })).toBeVisible();
  });

  test("footer innehåller användarvillkor", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Användarvillkor/i })).toBeVisible();
  });
});
