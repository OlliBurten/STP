/**
 * Åkeriernas egna annonser listas före Platsbanken-importerna.
 *
 * Jobblistan sorterades enbart på publiceringsdatum. Med ~20 nya importer om dagen
 * föll en egen annons ur sikte inom ett par dygn — precis när första riktiga
 * åkeriet (Värnamo Godstrafik, okt 2026) skulle börja annonsera.
 *
 * Run with: APP_LISTEN=false node --test test/directJobsFirst.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert";

process.env.APP_LISTEN = "false";
const { sortDirectJobsFirst } = await import("../routes/jobs.js");

const job = (id, source, claimed = false) => ({ id, source, claimed });

describe("sortDirectJobsFirst", () => {
  it("lägger egna och claimade annonser först och bevarar ordningen inom grupperna", () => {
    const input = [
      job("af-ny", "AGGREGATED"),
      job("egen-ny", "ORGANIC"),
      job("af-gammal", "AGGREGATED"),
      job("claimad", "AGGREGATED", true),
      job("egen-gammal", "ORGANIC"),
    ];
    assert.deepStrictEqual(
      sortDirectJobsFirst(input).map((j) => j.id),
      ["egen-ny", "claimad", "egen-gammal", "af-ny", "af-gammal"],
    );
  });

  it("behandlar saknad source som egen annons", () => {
    assert.deepStrictEqual(sortDirectJobsFirst([job("af", "AGGREGATED"), { id: "äldre" }]).map((j) => j.id), ["äldre", "af"]);
  });

  it("ändrar inte indatan", () => {
    const input = [job("af", "AGGREGATED"), job("egen", "ORGANIC")];
    sortDirectJobsFirst(input);
    assert.deepStrictEqual(input.map((j) => j.id), ["af", "egen"]);
  });
});
