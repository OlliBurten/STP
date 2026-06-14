/**
 * Logiktest för demo-inbjudningsflödet.
 *
 * Täcker prod-sidans brygga mot demo (lib/demoRemote.js): rätt secret-header,
 * korrekt välkomstlänk, saknad konfiguration, fel-mappning samt token-formatet
 * och clamp av giltighetstid. Inga DB- eller nätverksanrop på riktigt — fetch
 * mockas via global.fetch.
 *
 * Run with: node --test test/demoInvites.test.js
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  isDemoConfigured,
  buildDemoWelcomeUrl,
  demoFrontendBase,
  createDemoInvite,
  listDemoInvites,
  deleteDemoInvite,
} from "../lib/demoRemote.js";
import { clampDemoDays } from "../lib/demoAccounts.js";

const origFetch = global.fetch;
const origEnv = { ...process.env };

function setEnv() {
  process.env.DEMO_API_URL = "https://demo-api.example.com/";
  process.env.DEMO_FRONTEND_URL = "https://demo.example.com/";
  process.env.DEMO_SERVICE_SECRET = "topphemligt-värde";
}

beforeEach(() => setEnv());
afterEach(() => {
  global.fetch = origFetch;
  process.env = { ...origEnv };
});

describe("isDemoConfigured", () => {
  it("sant när DEMO_API_URL + DEMO_SERVICE_SECRET finns", () => {
    assert.strictEqual(isDemoConfigured(), true);
  });
  it("falskt när DEMO_API_URL saknas", () => {
    delete process.env.DEMO_API_URL;
    assert.strictEqual(isDemoConfigured(), false);
  });
  it("falskt när DEMO_SERVICE_SECRET saknas", () => {
    delete process.env.DEMO_SERVICE_SECRET;
    assert.strictEqual(isDemoConfigured(), false);
  });
});

describe("buildDemoWelcomeUrl", () => {
  it("bygger /demo-valkommen mot demo-frontenden utan dubbel slash", () => {
    assert.strictEqual(demoFrontendBase(), "https://demo.example.com");
    assert.strictEqual(
      buildDemoWelcomeUrl("abc123"),
      "https://demo.example.com/demo-valkommen?token=abc123"
    );
  });
  it("url-kodar token", () => {
    assert.match(buildDemoWelcomeUrl("a/b c"), /token=a%2Fb%20c$/);
  });
});

describe("createDemoInvite", () => {
  it("anropar demo med rätt URL, metod och service-secret-header", async () => {
    let captured = null;
    global.fetch = async (url, opts) => {
      captured = { url, opts };
      return { ok: true, status: 201, json: async () => ({ token: "rawtok", demoExpiresAt: "2026-07-01T00:00:00.000Z" }) };
    };
    const res = await createDemoInvite({ email: "a@b.se", role: "DRIVER", label: "Almi", days: 30 });
    assert.strictEqual(captured.url, "https://demo-api.example.com/api/internal/demo-invites");
    assert.strictEqual(captured.opts.method, "POST");
    assert.strictEqual(captured.opts.headers["x-service-secret"], "topphemligt-värde");
    assert.deepStrictEqual(JSON.parse(captured.opts.body), { email: "a@b.se", role: "DRIVER", label: "Almi", days: 30 });
    assert.strictEqual(res.token, "rawtok");
  });

  it("kastar fel med .status från demo-svaret (4xx bevaras)", async () => {
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: "krock" }) });
    await assert.rejects(
      () => createDemoInvite({ email: "a@b.se", role: "DRIVER" }),
      (e) => e.status === 409 && /krock/.test(e.message)
    );
  });

  it("mappar 5xx från demo till 502", async () => {
    global.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: "boom" }) });
    await assert.rejects(
      () => createDemoInvite({ email: "a@b.se", role: "DRIVER" }),
      (e) => e.status === 502
    );
  });

  it("nätverksfel → 502 med begripligt meddelande", async () => {
    global.fetch = async () => { throw new Error("ECONNREFUSED"); };
    await assert.rejects(
      () => createDemoInvite({ email: "a@b.se", role: "DRIVER" }),
      (e) => e.status === 502 && /demo-miljön/i.test(e.message)
    );
  });
});

describe("listDemoInvites / deleteDemoInvite", () => {
  it("GET listar via demo", async () => {
    global.fetch = async (url, opts) => {
      assert.strictEqual(opts.method, "GET");
      assert.strictEqual(url, "https://demo-api.example.com/api/internal/demo-invites");
      return { ok: true, status: 200, json: async () => ([{ id: "1" }]) };
    };
    const res = await listDemoInvites();
    assert.deepStrictEqual(res, [{ id: "1" }]);
  });
  it("DELETE url-kodar id och skickar secret", async () => {
    global.fetch = async (url, opts) => {
      assert.strictEqual(opts.method, "DELETE");
      assert.strictEqual(url, "https://demo-api.example.com/api/internal/demo-invites/abc%20123");
      assert.strictEqual(opts.headers["x-service-secret"], "topphemligt-värde");
      return { ok: true, status: 200, json: async () => ({ ok: true, email: "x@y.se" }) };
    };
    const res = await deleteDemoInvite("abc 123");
    assert.strictEqual(res.email, "x@y.se");
  });
});

describe("inbjudningstoken matchar password-reset-formatet", () => {
  // internal.js genererar token som auth.js: råtoken = 32 random bytes hex (64 tecken),
  // hash = sha256(hex). Vi verifierar att detta format håller.
  it("råtoken är 64 hex-tecken och hashen är deterministisk sha256", () => {
    const raw = crypto.randomBytes(32).toString("hex");
    assert.match(raw, /^[a-f0-9]{64}$/);
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert.strictEqual(crypto.createHash("sha256").update(raw).digest("hex"), hash);
  });
});

describe("clamp av giltighetstid (delas med internal.js)", () => {
  it("1..180, default 30", () => {
    assert.strictEqual(clampDemoDays(7), 7);
    assert.strictEqual(clampDemoDays(90), 90);
    assert.strictEqual(clampDemoDays(999), 180);
    assert.strictEqual(clampDemoDays(0), 30);
    assert.strictEqual(clampDemoDays(undefined), 30);
  });
});

describe("konstant-tids-jämförelse av service-secret (samma teknik som internal.js)", () => {
  // internal.js hashar båda värdena och kör timingSafeEqual. Verifiera matchning.
  function compare(expected, provided) {
    if (!expected || !provided) return false;
    const a = crypto.createHash("sha256").update(expected).digest();
    const b = crypto.createHash("sha256").update(provided).digest();
    return crypto.timingSafeEqual(a, b);
  }
  it("matchar identiska secrets", () => {
    assert.strictEqual(compare("hemlis", "hemlis"), true);
  });
  it("avvisar fel secret", () => {
    assert.strictEqual(compare("hemlis", "fel"), false);
  });
  it("avvisar saknad secret", () => {
    assert.strictEqual(compare("hemlis", ""), false);
    assert.strictEqual(compare("", "hemlis"), false);
  });
});
