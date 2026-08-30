/**
 * GitHub-token ska vara frivillig.
 *
 * En skrivbehörig PAT låg kvar i backendens miljö (Railway) långt efter att
 * agenten slutat skriva kod — githubCommit och sentryResolveIssue togs bort i
 * juni 2026, men kravet på GITHUB_TOKEN blev kvar. Token togs bort 2026-08-30,
 * och då tystnade hela fixförslaget: `getGitHub()` kastade, och grinden i
 * sentryAgent krävde token för att ens försöka.
 *
 * OlliBurten/STP är publikt och det enda anropet som finns kvar är en läsning
 * av filinnehåll, som fungerar oautentiserat (verifierat mot GitHubs API
 * 2026-08-30). Testerna låser att ingen råkar återinföra kravet — nästa gång
 * skulle symptomet bli en funktion som tyst slutar fungera, inte ett fel.
 *
 * Run with: node --test test/githubTokenOptional.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bugFix = readFileSync(new URL("../lib/bugFixAgent.js", import.meta.url), "utf8");
const sentry = readFileSync(new URL("../lib/sentryAgent.js", import.meta.url), "utf8");

// Kommentarer nämner GITHUB_TOKEN med flit — jämför bara mot kod.
const codeOnly = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

test("getGitHub kastar inte när GITHUB_TOKEN saknas", () => {
  const code = codeOnly(bugFix);
  const fn = code.match(/function getGitHub\(\)[\s\S]*?\n\}/)[0];
  // Rad för rad: en throw som nämner GITHUB_TOKEN är kravet vi tagit bort.
  // (Att bara söka över hela funktionen matchar även den frivilliga läsningen
  // på raden under — funktionen får läsa token, bara inte kräva den.)
  const throwsOnToken = fn.split("\n").some((l) => l.includes("throw") && l.includes("GITHUB_TOKEN"));
  assert.ok(!throwsOnToken,
    "token får inte vara ett hårt krav — repot är publikt och anropet är en läsning");
  assert.ok(/GITHUB_REPO/.test(fn) && /throw/.test(fn),
    "GITHUB_REPO ska däremot fortfarande krävas — utan repo vet vi inte vad vi läser");
});

test("Authorization-headern skickas bara när en token finns", () => {
  const code = codeOnly(bugFix);
  assert.ok(/\.\.\.\(token \? \{ Authorization/.test(code),
    "en tom Authorization-header ger 401 i stället för det oautentiserade anrop vi vill ha");
});

test("agenten skriver fortfarande aldrig till GitHub", () => {
  // Hela poängen med att token är frivillig bygger på att det bara läses.
  // Skulle någon återinföra en skrivning måste kravet tillbaka samtidigt.
  const code = codeOnly(bugFix);
  for (const forbidden of ['method: "PUT"', 'method: "POST"', 'method: "PATCH"', "git/refs", "/pulls"]) {
    assert.ok(!code.includes(forbidden),
      `bugFixAgent får inte skriva till GitHub (hittade ${forbidden})`);
  }
});

test("sentryAgent-grinden kräver inte token för att försöka", () => {
  const code = codeOnly(sentry);
  const gate = code.match(/if \([^)]*severity === "CRITICAL"\)/)[0];
  assert.ok(!gate.includes("GITHUB_TOKEN"),
    "kravet på token gjorde att fixförslaget tystnade helt när token togs bort");
  assert.ok(gate.includes("GITHUB_REPO"));
});
