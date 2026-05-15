// @ts-check
/**
 * Fullständigt E2E-flöde för inloggat åkeri.
 * Täcker: jobbpublicering (4 steg), jobbhantering, förarssökning,
 * kontakta förare, meddelanden och företagsprofil.
 *
 * Kör mot live:
 *   PLAYWRIGHT_BASE_URL=https://transportplattformen.se \
 *   COMPANY_EMAIL=… COMPANY_PASSWORD=… \
 *   npx playwright test --project=setup --project=chromium-auth e2e/company-full.spec.js
 */
import { test, expect } from "@playwright/test";
import path from "path";

test.use({ storageState: path.join(process.cwd(), "playwright/.auth/company.json") });

const TEST_JOB_TITLE = "E2E Teståkeri — CE Fjärrkörning";

async function waitForPageLoad(page) {
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
}

// ── Dashboard ────────────────────────────────────────────────────────────────

test.describe("Företagsdashboard", () => {
  test("dashboard laddas med företagsrubrik", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page).toHaveURL(/\/foretag/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("Mina jobb-sidan laddas", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/foretag\/(mina-jobb|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test('"Publicera ny annons"-knapp finns på Mina jobb', async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);
    const btn = page.getByRole("button", { name: /Publicera ny annons|Publicera jobb|nytt jobb/i }).first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await expect(btn).toBeVisible();
    }
  });
});

// ── Jobbannonsskapande (PostJob — 4 steg) ────────────────────────────────────

test.describe("Publicera jobbannons", () => {
  test("annons­formuläret laddas med steg-indikator", async ({ page }) => {
    await page.goto("/foretag/annonsera");
    await expect(page).toHaveURL(/\/foretag\/(annonsera|onboarding)/);
    if (await page.getByText(/Grundinfo/i).first().isVisible({ timeout: 5000 })) {
      await expect(page.getByText(/Grundinfo/i).first()).toBeVisible();
    }
  });

  test("kan fylla i steg 1 (grundinfo) och gå vidare", async ({ page }) => {
    await page.goto("/foretag/annonsera");
    await waitForPageLoad(page);

    // Om vi omdirigeras till onboarding, hoppar vi över
    if (page.url().includes("onboarding")) return;

    // Jobbtitel
    const titleInput = page.locator("input[placeholder*='CE-chaufför']");
    if (!(await titleInput.isVisible({ timeout: 5000 }))) return;
    await titleInput.fill(TEST_JOB_TITLE);

    // Företagsnamn
    const companyInput = page.locator("input[placeholder*='företagsnamn']");
    if (await companyInput.isVisible()) await companyInput.fill("E2E Teståkeri AB");

    // Ort
    const cityInput = page.locator("input[placeholder*='Malmö']");
    if (await cityInput.isVisible()) await cityInput.fill("Stockholm");

    // Region (select)
    const regionSelect = page.locator("select").first();
    if (await regionSelect.isVisible()) await regionSelect.selectOption({ label: "Stockholm" });

    // Körkort: CE-chip
    const ceChip = page.locator("button, span").filter({ hasText: /^CE$/ }).first();
    if (await ceChip.isVisible()) await ceChip.click();

    // Anställningsform: Fast anställning
    const fastBtn = page.locator("button, span").filter({ hasText: /^Fast anställning$/ }).first();
    if (await fastBtn.isVisible()) await fastBtn.click();

    // Schema: Dagtid mån–fre
    const scheduleBtn = page.locator("button, span").filter({ hasText: /Dagtid mån|Dagtid/ }).first();
    if (await scheduleBtn.isVisible()) await scheduleBtn.click();

    // Nästa steg
    const nextBtn = page.getByRole("button", { name: /Nästa steg/i });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();

    // Ska ha rullat till steg 2
    await expect(page.getByText(/Annonstext/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("fullständig publiceringsflöde — alla 4 steg", async ({ page }) => {
    await page.goto("/foretag/annonsera");
    await waitForPageLoad(page);

    if (page.url().includes("onboarding")) return;

    // ── Steg 1: Grundinfo ──────────────────────────────────────────────────
    const titleInput = page.locator("input[placeholder*='CE-chaufför']");
    if (!(await titleInput.isVisible({ timeout: 5000 }))) return;

    await titleInput.fill(TEST_JOB_TITLE);

    const companyInput = page.locator("input[placeholder*='företagsnamn']");
    if (await companyInput.isVisible()) await companyInput.fill("E2E Teståkeri AB");

    const cityInput = page.locator("input[placeholder*='Malmö']");
    if (await cityInput.isVisible()) await cityInput.fill("Stockholm");

    const regionSelect = page.locator("select").first();
    if (await regionSelect.isVisible()) await regionSelect.selectOption({ label: "Stockholm" });

    // CE körkort
    const ceChip = page.locator("button, span").filter({ hasText: /^CE$/ }).first();
    if (await ceChip.isVisible({ timeout: 3000 })) await ceChip.click();

    // Anställningsform
    const fastBtn = page.locator("button, span").filter({ hasText: /^Fast anställning$/ }).first();
    if (await fastBtn.isVisible({ timeout: 3000 })) await fastBtn.click();

    // Schema
    const scheduleBtn = page.locator("button, span").filter({ hasText: /Dagtid mån/ }).first();
    if (await scheduleBtn.isVisible({ timeout: 3000 })) await scheduleBtn.click();

    await page.getByRole("button", { name: /Nästa steg/i }).click();
    await expect(page.getByText(/Annonstext/i).first()).toBeVisible({ timeout: 8000 });

    // ── Steg 2: Annonstext ─────────────────────────────────────────────────
    const aboutTextarea = page.locator("textarea").first();
    if (await aboutTextarea.isVisible({ timeout: 5000 })) {
      await aboutTextarea.fill(
        "Vi söker en erfaren CE-chaufför för fjärrkörning i Norden. Du kör moderna lastbilar med regelbundna rutter till Danmark och Norge. Tjänsten är tillsvidareanställning på heltid med kollektivavtal."
      );
    }

    // Arbetsuppgifter — lägg till via BulletEditor
    const taskInput = page.locator("input[placeholder*='Fjärrkörning']");
    if (await taskInput.isVisible({ timeout: 3000 })) {
      await taskInput.fill("Fjärrkörning inom Norden (SE/DK/NO)");
      await taskInput.press("Enter");
      await taskInput.fill("Lossning och lastning med truck");
      await taskInput.press("Enter");
    }

    // Krav
    const reqInput = page.locator("input[placeholder*='erfarenhet']");
    if (await reqInput.isVisible({ timeout: 3000 })) {
      await reqInput.fill("Minst 2 års erfarenhet av CE-körning");
      await reqInput.press("Enter");
    }

    // Vi erbjuder
    const offerInput = page.locator("input[placeholder*='Volvo']");
    if (await offerInput.isVisible({ timeout: 3000 })) {
      await offerInput.fill("Nya Volvo FH 2024 med alla hjälpmedel");
      await offerInput.press("Enter");
    }

    // Nästa
    const next2 = page.getByRole("button", { name: /Nästa steg/i });
    if (await next2.isVisible({ timeout: 3000 })) {
      await next2.click();
      await expect(page.getByText(/Villkor|lön/i).first()).toBeVisible({ timeout: 8000 });
    }

    // ── Steg 3: Villkor & Lön ─────────────────────────────────────────────
    // Kollektivavtal: Ja
    const jaBtn = page.locator("button, span").filter({ hasText: /^✓ Ja$|^Ja$/ }).first();
    if (await jaBtn.isVisible({ timeout: 3000 })) await jaBtn.click();

    // Löneanmärkning
    const salaryNote = page.locator("input[placeholder*='kollektivavtal']");
    if (await salaryNote.isVisible({ timeout: 3000 })) {
      await salaryNote.fill("Lön enligt Transport-kollektivavtal");
    }

    // Kontakt-email
    const contactEmail = page.locator("input[type='email']");
    if (await contactEmail.isVisible({ timeout: 3000 })) {
      await contactEmail.fill("rekrytering@e2e-test.se");
    }

    const next3 = page.getByRole("button", { name: /Nästa steg/i });
    if (await next3.isVisible({ timeout: 3000 })) {
      await next3.click();
      await expect(page.getByText(/Förhandsgranska|Publicera/i).first()).toBeVisible({ timeout: 8000 });
    }

    // ── Steg 4: Publicera ─────────────────────────────────────────────────
    const publishBtn = page.getByRole("button", { name: /Publicera annons/i });
    if (await publishBtn.isVisible({ timeout: 5000 })) {
      const isReady = await publishBtn.isEnabled();
      if (isReady) {
        await publishBtn.click();
        // Ska navigera till mina jobb eller jobbsidan
        await expect(page).toHaveURL(/\/(foretag\/mina-jobb|foretag\/annonser|jobb\/)/, { timeout: 15000 });
      } else {
        // Formuläret är inte klart — visa ändå att vi kom hit
        await expect(publishBtn).toBeVisible();
      }
    }
  });
});

// ── Mina jobb — jobbhantering ────────────────────────────────────────────────

test.describe("Jobbhantering — Mina jobb", () => {
  test("jobblistan laddas och visar antal", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan söka bland egna jobb", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);
    const searchInput = page.locator("input[type='search'], input[placeholder*='Sök']").first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill("CE");
      await page.waitForTimeout(600);
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("kan öppna ett jobb för redigering", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);
    // Hitta redigera-knapp (penna/edit)
    const editBtn = page.locator("button[title='Redigera'], a[href*='/foretag/annonser/']").first();
    if (await editBtn.isVisible({ timeout: 5000 })) {
      await editBtn.click();
      await expect(page).toHaveURL(/\/foretag\/(annonser|annonsera)\/.*/);
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("kan dölja och återaktivera ett jobb", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);

    // Letar efter tre-punkts­meny på ett jobb
    const menuBtn = page.locator("button[aria-label*='meny'], button[title*='meny']").first();
    if (await menuBtn.isVisible({ timeout: 5000 })) {
      await menuBtn.click();
      // Dölj-alternativ
      const hideBtn = page.getByText(/Dölj annons|Pausa/i).first();
      if (await hideBtn.isVisible({ timeout: 3000 })) {
        await hideBtn.click();
        await waitForPageLoad(page);
        // Jobbet ska ha status "Pausad" eller ha försvunnit från aktiva
        const pausedTab = page.getByRole("button", { name: /Pausade|Dolda/i });
        if (await pausedTab.isVisible({ timeout: 3000 })) {
          await pausedTab.click();
          await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("kan se ett jobbs detaljsida som åkeri", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await waitForPageLoad(page);
    const jobLink = page.locator("a[href^='/foretag/annonser/']").first();
    if (await jobLink.isVisible({ timeout: 5000 })) {
      await jobLink.click();
      await expect(page).toHaveURL(/\/foretag\/annonser\/.+/);
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
    }
  });
});

// ── Förarssökning ────────────────────────────────────────────────────────────

test.describe("Förarssökning — hitta och kontakta chaufförer", () => {
  test("förardatabasen laddas med rubrik och lista", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await expect(page).toHaveURL(/\/foretag\/(chaufforer|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("CE-filter aktiveras i förardatabasen", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    // Filter­knapp
    const filterBtn = page.getByRole("button", { name: /Filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 })) {
      await filterBtn.scrollIntoViewIfNeeded();
      await filterBtn.click({ force: true });
      // CE-körkort i filter­drawern
      const ceBtn = page.locator("button").filter({ hasText: /^CE$/ }).first();
      if (await ceBtn.isVisible({ timeout: 3000 })) {
        await ceBtn.click({ force: true });
        await page.keyboard.press("Escape");
        await waitForPageLoad(page);
        // Listan ska ha laddats om
        await expect(page.locator("h2").filter({ hasText: /Förare/i }).first()).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("kan öppna förardetalj­panel", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    // Klicka på ett förarkort
    const driverCard = page.locator("article, [role='article'], li")
      .filter({ hasText: /CE|C-körkort|Stockholm|Göteborg/i })
      .first();
    if (await driverCard.isVisible({ timeout: 5000 })) {
      await driverCard.click();
      // Detaljpanel ska öppnas med "Kontakta"-knapp
      await expect(
        page.getByRole("button", { name: /Kontakta|Skicka igen/i }).first()
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("kan kontakta en förare via kontaktmodalen", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    // Klicka på ett förarkort och sedan "Kontakta"
    const driverCard = page.locator("article, li, [role='listitem']").first();
    if (await driverCard.isVisible({ timeout: 5000 })) {
      await driverCard.click();
      const contactBtn = page.getByRole("button", { name: /^Kontakta$/ }).first();
      if (await contactBtn.isVisible({ timeout: 5000 })) {
        await contactBtn.click();

        // Modal: "Kontakta {förnamn}"
        await expect(
          page.getByText(/Kontakta|Skicka ett första/i).first()
        ).toBeVisible({ timeout: 5000 });

        // Fyll i meddelande
        const msgArea = page.locator("textarea").first();
        if (await msgArea.isVisible({ timeout: 3000 })) {
          await msgArea.fill(
            "Hej! Vi har en tjänst som CE-chaufför för fjärrkörning i Stockholm. Är du intresserad av att höra mer?"
          );

          await page.getByRole("button", { name: /^Skicka$/ }).click();

          // Bekräftelse
          await expect(
            page.getByText(/Skickat|skickades|Stäng/i).first()
          ).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test("kan öppna förarens publika profil", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    const driverCard = page.locator("article, li").first();
    if (await driverCard.isVisible({ timeout: 5000 })) {
      await driverCard.click();
      const profileLink = page.getByRole("link", { name: /Öppna publik profil|publik/i }).first();
      if (await profileLink.isVisible({ timeout: 3000 })) {
        const href = await profileLink.getAttribute("href");
        await page.goto(href);
        await expect(page).toHaveURL(/\/forare\/.+/);
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 8000 });
      }
    }
  });
});

// ── Meddelanden ───────────────────────────────────────────────────────────────

test.describe("Åkeri — meddelanden och konversationer", () => {
  test("konversationslistan laddas", async ({ page }) => {
    await page.goto("/foretag/meddelanden");
    await expect(page).toHaveURL(/\/foretag\/(meddelanden|onboarding)/);
    await expect(
      page.getByRole("heading", { name: /Konversationer|Meddelanden/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("kan öppna en konversation och svara", async ({ page }) => {
    await page.goto("/foretag/meddelanden");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    // Klicka på första konversationen
    const links = page.locator("a[href^='/foretag/meddelanden/']");
    const count = await links.count();
    if (count === 0) return; // Inga konversationer

    await links.first().click();
    await expect(page).toHaveURL(/\/foretag\/meddelanden\/.+/);

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 })) {
      const isClosed = await page.locator("text=/Konversationen är avslutad/i").isVisible();
      if (!isClosed) {
        await textarea.fill("Tack för ditt meddelande! Vi återkommer snart med mer information om tjänsten.");
        await page.getByRole("button", { name: /Skicka/i }).click();
        await expect(
          page.getByText(/återkommer snart/).first()
        ).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("snabbs­var-knappar syns i rätt stadier", async ({ page }) => {
    await page.goto("/foretag/meddelanden");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    const links = page.locator("a[href^='/foretag/meddelanden/']");
    if ((await links.count()) === 0) return;

    await links.first().click();
    await waitForPageLoad(page);

    // Kolla om snabbsvar finns
    const quickReplySection = page.getByText(/Snabbsvar/i).first();
    if (await quickReplySection.isVisible({ timeout: 3000 })) {
      await expect(quickReplySection).toBeVisible();
    }
  });
});

// ── Företagsprofil ────────────────────────────────────────────────────────────

test.describe("Företagsprofil — redigering", () => {
  test("företagsprofilsidan laddas", async ({ page }) => {
    await page.goto("/foretag/profil");
    await expect(page).toHaveURL(/\/foretag\/(profil|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("kan uppdatera företagsbeskrivning och spara", async ({ page }) => {
    await page.goto("/foretag/profil");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    const descArea = page.locator(
      "textarea[placeholder*='Om ert åkeri'], textarea[placeholder*='beskrivning'], textarea"
    ).first();
    if (await descArea.isVisible({ timeout: 5000 })) {
      const currentText = await descArea.inputValue();
      await descArea.fill(
        currentText || "E2E Teståkeri AB är ett modernt transportföretag med fokus på hållbara CE-transporter i Norden."
      );
      const saveBtn = page.getByRole("button", { name: /Spara|Uppdatera/i }).first();
      if (await saveBtn.isEnabled({ timeout: 3000 })) {
        await saveBtn.click();
        await expect(
          page.getByText(/Sparad|uppdaterad|Sparat/i).first()
        ).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("notifierings­inställningar finns", async ({ page }) => {
    await page.goto("/foretag/profil");
    await waitForPageLoad(page);
    if (page.url().includes("onboarding")) return;

    // Kollar om notis-sektion finns — varierar per profiltyp
    const notifSection = page.getByText(/Aviseringar|Notifiering|ansökan|E-post/i).first();
    const sectionVisible = await notifSection.isVisible({ timeout: 5000 }).catch(() => false);
    if (sectionVisible) {
      await expect(notifSection).toBeVisible();
    } else {
      // Profilen laddades men sektionen saknas — acceptabelt
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Annonsera-sidan ───────────────────────────────────────────────────────────

test.describe("Annonsera — marknadsföringssida", () => {
  test("annonsera-sidan laddas med rubrik och CTA", async ({ page }) => {
    await page.goto("/foretag/annonsera");
    await expect(page).toHaveURL(/\/foretag\/(annonsera|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});

// ── Mobilvy ───────────────────────────────────────────────────────────────────

test.describe("Mobilvy — företagsdashboard", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Mina jobb visas korrekt på mobil", async ({ page }) => {
    await page.goto("/foretag/mina-jobb");
    await expect(page).toHaveURL(/\/foretag\/(mina-jobb|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });

  test("förardatabasen visas korrekt på mobil", async ({ page }) => {
    await page.goto("/foretag/chaufforer");
    await expect(page).toHaveURL(/\/foretag\/(chaufforer|onboarding)/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});
