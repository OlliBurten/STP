import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeAggregatedJobs } from "../lib/jobDedupe.js";

const agg = (over) => ({ source: "AGGREGATED", claimed: false, company: "Bolt Works Sverige AB", title: "HIAB-förare sökes till vår kund i Boden", ...over });

test("kollapsar samma aggregerade annons postad i flera orter — nyaste vinner", () => {
  const jobs = [agg({ id: "a", location: "Umeå" }), agg({ id: "b", location: "Luleå" }), agg({ id: "c", location: "Kiruna" })];
  const out = dedupeAggregatedJobs(jobs);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("normaliserar titel — skiljetecken/versaler/whitespace räknas inte som skillnad", () => {
  const jobs = [agg({ id: "a" }), agg({ id: "b", title: "  hiab-förare sökes till vår kund i boden!! " })];
  assert.equal(dedupeAggregatedJobs(jobs).length, 1);
});

test("olika titel eller olika företag är inte dubbletter", () => {
  const jobs = [agg({ id: "a" }), agg({ id: "b", title: "CE-chaufför Boden" }), agg({ id: "c", company: "Annat Åkeri AB" })];
  assert.equal(dedupeAggregatedJobs(jobs).length, 3);
});

test("rör aldrig STP-egna eller claimade annonser", () => {
  const jobs = [
    { source: "ORGANIC", claimed: false, company: "X", title: "Samma titel", id: "a" },
    { source: "ORGANIC", claimed: false, company: "X", title: "Samma titel", id: "b" },
    agg({ id: "c", claimed: true, title: "Samma titel", company: "X" }),
    agg({ id: "d", claimed: true, title: "Samma titel", company: "X" }),
  ];
  assert.equal(dedupeAggregatedJobs(jobs).length, 4);
});
