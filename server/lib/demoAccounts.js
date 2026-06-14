// Demokonton — tidsbegränsade konton som delas ut till potentiella kunder,
// partners och investerare så de kan logga in och se hela plattformen fylld med
// (påhittad) data utan tillgång till produktionens riktiga användardata.
//
// SÄKERHET: Demokonton får ALDRIG skapas i produktion. De skapas bara i
// demo-miljön (DEPLOYMENT=demo), som har en helt separat databas och frontend.
// Guarden lever i route-lagret (server/routes/admin.js) via isDemoEnvironment().

import crypto from "node:crypto";

export const DEMO_EMAIL_DOMAIN = "demo.transportplattformen.se";
export const DEMO_DEFAULT_DAYS = 30;
export const DEMO_MAX_DAYS = 180;

// Sant bara när backend kör i demo-miljön. Samma DEPLOYMENT-signal som server.js
// använder ("production" i prod, "demo" i demo). Vi normaliserar för robusthet.
export function isDemoEnvironment() {
  return (process.env.DEPLOYMENT || "").trim().toLowerCase() === "demo";
}

// Slumpmässig URL-säker sträng (a–z, 0–9) av given längd.
function randomToken(length) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// E-post på formen demo-<role>-<8 slumptecken>@demo.transportplattformen.se
export function generateDemoEmail(role) {
  const r = String(role || "").trim().toLowerCase() === "company" ? "company" : "driver";
  return `demo-${r}-${randomToken(8)}@${DEMO_EMAIL_DOMAIN}`;
}

// Starkt slumplösenord. Blandar versaler, gemener, siffror och ett specialtecken
// så det uppfyller även strikta lösenordskrav. Visas EN gång för admin.
export function generateDemoPassword() {
  const lowers = "abcdefghijkmnpqrstuvwxyz";
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = lowers + uppers + digits + special;
  const pick = (set) => set[crypto.randomInt(set.length)];
  // Garantera minst ett av varje kategori, fyll sedan upp till 16 tecken.
  const chars = [pick(lowers), pick(uppers), pick(digits), pick(special)];
  while (chars.length < 16) chars.push(pick(all));
  // Fisher–Yates-blandning så att de garanterade tecknen inte hamnar först.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// Normalisera och begränsa giltighetstiden (1–180 dagar, default 30).
export function clampDemoDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return DEMO_DEFAULT_DAYS;
  return Math.min(Math.floor(n), DEMO_MAX_DAYS);
}

// Utgångsdatum = now + days.
export function demoExpiryDate(days, now = new Date()) {
  const d = clampDemoDays(days);
  return new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
}

// Sant om ett demokonto har passerat sitt utgångsdatum.
export function isDemoExpired(user, now = new Date()) {
  if (!user?.isDemo || !user?.demoExpiresAt) return false;
  return new Date(user.demoExpiresAt) < now;
}
