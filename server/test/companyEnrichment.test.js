/**
 * Logiktest för enrichCompanyProfile — alla källor mockade via deps-injektion.
 * Inga riktiga anrop mot Hitta.se eller Claude görs här.
 * Run with: node --test test/companyEnrichment.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { enrichCompanyProfile, regionFromCity, suggestBransch } from "../lib/companyEnrichment.js";

// En Hitta.se-träff i samma form som __NEXT_DATA__-företagslistan
const hittaCompany = {
  displayName: "C4 Transport AB",
  phone: [{ callTo: "044-123456", displayAs: "044-12 34 56" }],
  address: [{ city: "Kristianstad" }],
  attribute: [{ name: "email", value: "info@c4transport.se" }],
  products: [{ image: [{ link: "https://www.c4transport.se/start" }] }],
};

const WEBSITE_TEXT =
  "C4 Transport är ett åkeri i Kristianstad. Vi kör fjärrtrafik och distribution " +
  "i hela södra Sverige med moderna lastbilar. Vi erbjuder även kyltransport för livsmedel. " +
  "Kontakta oss gärna för mer information om våra transporttjänster och vår verksamhet i Skåne.";

describe("enrichCompanyProfile", () => {
  it("alla källor ok → komplett förslag med sources", async () => {
    const result = await enrichCompanyProfile(
      { companyName: "C4 Transport AB", orgNumber: "5566778899", location: "Kristianstad" },
      {
        fetchCompanies: async () => [hittaCompany],
        fetchPageText: async () => WEBSITE_TEXT,
        describe: async () => "Vi är ett åkeri i Kristianstad som kör fjärrtrafik och distribution i södra Sverige. Vi erbjuder även kyltransporter för livsmedel.",
      }
    );

    assert.strictEqual(result.website, "https://www.c4transport.se");
    assert.strictEqual(result.phone, "044-123456");
    assert.strictEqual(result.email, "info@c4transport.se");
    assert.strictEqual(result.location, "Kristianstad");
    assert.strictEqual(result.region, "Skåne");
    assert.ok(result.description.startsWith("Vi är ett åkeri"));
    assert.ok(Array.isArray(result.bransch) && result.bransch.length > 0);
    assert.ok(result.bransch.includes("kyltransporter"));
    assert.strictEqual(result.sources.website, "hitta.se");
    assert.strictEqual(result.sources.description, "AI utifrån företagets webbplats");
  });

  it("Hitta failar → övriga fält tas fram ändå, ingen krasch", async () => {
    let describeCalled = false;
    const result = await enrichCompanyProfile(
      { companyName: "C4 Transport AB", location: "Kristianstad" },
      {
        fetchCompanies: async () => { throw new Error("Hitta.se nere"); },
        fetchPageText: async () => WEBSITE_TEXT,
        describe: async () => { describeCalled = true; return "..."; },
      }
    );

    // Hitta-fälten saknas, men region härleds från känd ort
    assert.strictEqual(result.website, null);
    assert.strictEqual(result.phone, null);
    assert.strictEqual(result.email, null);
    assert.strictEqual(result.region, "Skåne");
    // Ingen webbplats → ingen beskrivning (Claude anropas inte)
    assert.strictEqual(result.description, null);
    assert.strictEqual(describeCalled, false);
  });

  it("ingen webbplats i Hitta-träffen → ingen beskrivning", async () => {
    let describeCalled = false;
    const noWebsiteCompany = {
      displayName: "C4 Transport AB",
      phone: [{ callTo: "044-123456" }],
      address: [{ city: "Kristianstad" }],
      attribute: [], // ingen e-post → ingen domän att härleda webbplats från
      products: [],
    };
    const result = await enrichCompanyProfile(
      { companyName: "C4 Transport AB" },
      {
        fetchCompanies: async () => [noWebsiteCompany],
        fetchPageText: async () => WEBSITE_TEXT,
        describe: async () => { describeCalled = true; return "..."; },
      }
    );

    assert.strictEqual(result.website, null);
    assert.strictEqual(result.description, null);
    assert.strictEqual(describeCalled, false);
    // Telefon och ort kommer ändå från Hitta, region härleds från Hitta-orten
    assert.strictEqual(result.phone, "044-123456");
    assert.strictEqual(result.location, "Kristianstad");
    assert.strictEqual(result.region, "Skåne");
  });

  it("ingen namnmatchning i Hitta-resultatet → inga Hitta-fält", async () => {
    const result = await enrichCompanyProfile(
      { companyName: "C4 Transport AB" },
      {
        fetchCompanies: async () => [{ ...hittaCompany, displayName: "Helt Annat Åkeri AB" }],
        fetchPageText: async () => null,
        describe: async () => null,
      }
    );
    assert.strictEqual(result.website, null);
    assert.strictEqual(result.email, null);
    assert.strictEqual(result.phone, null);
  });

  it("tomt företagsnamn → tomt resultat utan anrop", async () => {
    let called = false;
    const result = await enrichCompanyProfile(
      { companyName: "" },
      { fetchCompanies: async () => { called = true; return null; } }
    );
    assert.strictEqual(called, false);
    assert.strictEqual(result.website, null);
    assert.deepStrictEqual(result.sources, {});
  });
});

describe("regionFromCity", () => {
  it("känd ort → region", () => {
    assert.strictEqual(regionFromCity("Kristianstad"), "Skåne");
    assert.strictEqual(regionFromCity("göteborg"), "Västra Götaland");
    assert.strictEqual(regionFromCity("Umeå"), "Västerbotten");
  });
  it("okänd ort → null (utelämna hellre än gissa)", () => {
    assert.strictEqual(regionFromCity("Lillsjöhögen"), null);
    assert.strictEqual(regionFromCity(""), null);
    assert.strictEqual(regionFromCity(null), null);
  });
});

describe("suggestBransch", () => {
  it("tydliga nyckelord → giltiga värden, max 3", () => {
    const hits = suggestBransch("Vi kör tankbil med drivmedel, bärgning och timmertransport samt kranbil.");
    assert.ok(Array.isArray(hits));
    assert.ok(hits.length <= 3);
    assert.ok(hits.includes("tankbil-drivmedel"));
  });
  it("ingen indikation → null", () => {
    assert.strictEqual(suggestBransch("Vi är ett trevligt företag i Sverige."), null);
    assert.strictEqual(suggestBransch(""), null);
  });
});
