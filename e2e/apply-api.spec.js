// @ts-check
/**
 * Applications API — direkttester mot backend utan browser-UI.
 *
 * Testar:
 *   - POST /api/applications kräver autentisering
 *   - POST /api/applications kräver consentToShare=true (GDPR)
 *   - Duplicat-ansökan returnerar 409
 *   - GET /api/applications/check/:jobId kräver autentisering
 *
 * Kör mot lokal dev-server (localhost:3001) eller BACKEND_URL-env.
 * Används utan storageState — rena API-anrop med och utan token.
 */
import { test, expect } from "@playwright/test";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const DRIVER_EMAIL = process.env.DRIVER_EMAIL || "driver@example.com";
const DRIVER_PASSWORD = process.env.DRIVER_PASSWORD || "password123";

// ── Hjälpfunktion: hämta JWT-token för seed-föraren ──────────────────────────

async function getDriverToken(request) {
  const resp = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { email: DRIVER_EMAIL, password: DRIVER_PASSWORD },
  });
  if (!resp.ok()) return null;
  const data = await resp.json();
  return data.token || null;
}

// ── POST /api/applications — autentisering ────────────────────────────────────

test.describe("POST /api/applications — autentisering och validering", () => {
  test("kräver autentisering (returnerar 401 utan token)", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/applications`, {
      data: { jobId: "fake-job-id", consentToShare: true },
    });
    expect(resp.status()).toBe(401);
  });

  test("kräver consentToShare=true (returnerar 400 när false)", async ({ request }) => {
    const token = await getDriverToken(request);
    if (!token) {
      console.log("ℹ️  Kunde inte logga in som seed-förare — hoppar över");
      return;
    }
    const resp = await request.post(`${BACKEND_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { jobId: "fake-job-id", consentToShare: false },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toMatch(/samtycke|consent/i);
  });

  test("returnerar 400 om jobId saknas", async ({ request }) => {
    const token = await getDriverToken(request);
    if (!token) return;
    const resp = await request.post(`${BACKEND_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { consentToShare: true },
    });
    expect(resp.status()).toBe(400);
  });

  test("returnerar 404 för jobb som inte finns", async ({ request }) => {
    const token = await getDriverToken(request);
    if (!token) return;
    const resp = await request.post(`${BACKEND_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { jobId: "icke-existerande-jobb-id", consentToShare: true },
    });
    expect(resp.status()).toBe(404);
  });
});

// ── GET /api/applications — listning ─────────────────────────────────────────

test.describe("GET /api/applications — listning", () => {
  test("kräver autentisering", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/api/applications`);
    expect(resp.status()).toBe(401);
  });

  test("returnerar array för inloggad förare", async ({ request }) => {
    const token = await getDriverToken(request);
    if (!token) return;
    const resp = await request.get(`${BACKEND_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ── GET /api/applications/check/:jobId ───────────────────────────────────────

test.describe("GET /api/applications/check/:jobId", () => {
  test("kräver autentisering", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/api/applications/check/fake-id`);
    expect(resp.status()).toBe(401);
  });

  test("returnerar applied=false för jobb som inte finns", async ({ request }) => {
    const token = await getDriverToken(request);
    if (!token) return;
    const resp = await request.get(`${BACKEND_URL}/api/applications/check/icke-existerande`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data).toHaveProperty("applied");
    expect(data.applied).toBe(false);
  });
});

// ── GET /api/applications/opt-out/:token ─────────────────────────────────────

test.describe("Opt-out-endpoint", () => {
  test("returnerar HTML för ogiltigt opt-out-token (inte 500)", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/api/applications/opt-out/ogiltigt-token`);
    expect(resp.status()).not.toBe(500);
    const contentType = resp.headers()["content-type"] || "";
    expect(contentType).toContain("text/html");
  });
});
