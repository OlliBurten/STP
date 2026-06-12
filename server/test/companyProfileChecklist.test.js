/**
 * Logiktest för companyProfileChecklist + mergeCompanyProfile.
 * Run with: node --test test/companyProfileChecklist.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { companyProfileChecklist, mergeCompanyProfile } from "../lib/companyProfileChecklist.js";

const fullOrg = {
  name: "C4 Transport AB",
  orgNumber: "556677-8899",
  description: "Vi kör tank och distribution i Skåne.",
  website: "https://c4transport.se",
  location: "Kristianstad",
  segmentDefaults: ["FULLTIME"],
  bransch: ["tank", "distribution"],
  region: "Skåne",
};

describe("companyProfileChecklist", () => {
  it("returnerar exakt 8 punkter", () => {
    const items = companyProfileChecklist({});
    assert.strictEqual(items.length, 8);
    assert.deepStrictEqual(
      items.map((i) => i.key),
      [
        "companyName",
        "companyOrgNumber",
        "companySegmentDefaults",
        "companyDescription",
        "companyWebsite",
        "companyLocation",
        "companyBransch",
        "companyRegion",
      ]
    );
  });

  it("org-baserat åkeri med all data på Organization → inga falska 'saknas'", () => {
    // User helt tom (som tyra@c4transport.se) — allt ligger på Organization.
    const user = { name: "Tyra", companyName: null, companyOrgNumber: null, companySegmentDefaults: [] };
    const merged = mergeCompanyProfile(user, fullOrg);
    const missing = companyProfileChecklist(merged).filter((c) => !c.ok);
    assert.deepStrictEqual(missing, [], `Förväntade inga saknade punkter, fick: ${missing.map((m) => m.label).join(", ")}`);
  });

  it("åkeri som saknar beskrivning, bransch och region → exakt de tre listas", () => {
    const user = {
      name: "Test",
      companyName: "Testfrakt AB",
      companyOrgNumber: "556000-0000",
      companySegmentDefaults: ["FULLTIME"],
      companyWebsite: "https://testfrakt.se",
      companyLocation: "Umeå",
      companyDescription: null,
      companyBransch: [],
      companyRegion: null,
    };
    const merged = mergeCompanyProfile(user, null);
    const missing = companyProfileChecklist(merged).filter((c) => !c.ok);
    assert.deepStrictEqual(
      missing.map((m) => m.label).sort(),
      ["bransch", "företagsbeskrivning", "region"]
    );
  });

  it("User-fält vinner över Organization-fält vid merge", () => {
    const user = { companyName: "Eget Namn AB", companyRegion: "Norrbotten" };
    const merged = mergeCompanyProfile(user, fullOrg);
    assert.strictEqual(merged.companyName, "Eget Namn AB");
    assert.strictEqual(merged.companyRegion, "Norrbotten");
    // ...men tomma User-fält faller tillbaka på org
    assert.strictEqual(merged.companyOrgNumber, "556677-8899");
    assert.deepStrictEqual(merged.companyBransch, ["tank", "distribution"]);
  });

  it("legacy-konto utan org: tomma fält listas som saknade", () => {
    const merged = mergeCompanyProfile({ name: "Bara Namn" }, null);
    const missing = companyProfileChecklist(merged).filter((c) => !c.ok);
    // Namn finns (via user.name) — resterande 7 saknas
    assert.strictEqual(missing.length, 7);
    assert.ok(!missing.some((m) => m.key === "companyName"));
  });
});
