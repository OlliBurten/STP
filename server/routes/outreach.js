import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import { sendEmail } from "../lib/email.js";
import Anthropic from "@anthropic-ai/sdk";
import { runOutreachAgent } from "../lib/outreachAgent.js";

export const outreachRouter = Router();
outreachRouter.use(authMiddleware, requireAdmin);

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && String(v).trim() !== "");
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
outreachRouter.get("/stats", async (req, res, next) => {
  try {
    const counts = await prisma.outreachProspect.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const total = counts.reduce((s, c) => s + c._count._all, 0);
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
    res.json({ total, byStatus });
  } catch (e) { next(e); }
});

// ─── List prospects ───────────────────────────────────────────────────────────
outreachRouter.get("/prospects", async (req, res, next) => {
  try {
    const { status, region, q, limit = "100", offset = "0" } = req.query;
    const where = {};
    if (status) where.status = status;
    if (region) where.region = region;
    if (q) {
      where.OR = [
        { companyName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }
    const [prospects, total] = await Promise.all([
      prisma.outreachProspect.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(parseInt(limit) || 100, 200),
        skip: parseInt(offset) || 0,
      }),
      prisma.outreachProspect.count({ where }),
    ]);
    res.json({ prospects, total });
  } catch (e) { next(e); }
});

// ─── Add manual prospect ──────────────────────────────────────────────────────
outreachRouter.post("/prospects", async (req, res, next) => {
  try {
    const { companyName, orgNumber, website, email, phone, region, city } = req.body;
    if (!companyName?.trim()) return res.status(400).json({ error: "companyName krävs" });
    const prospect = await prisma.outreachProspect.create({
      data: {
        companyName: companyName.trim(),
        orgNumber: orgNumber?.trim() || null,
        website: website?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        region: region?.trim() || null,
        city: city?.trim() || null,
        source: "manual",
        status: email?.trim() ? "ENRICHED" : "NEW",
      },
    });
    res.json(prospect);
  } catch (e) { next(e); }
});

// ─── Delete prospect ──────────────────────────────────────────────────────────
outreachRouter.delete("/prospects/:id", async (req, res, next) => {
  try {
    await prisma.outreachProspect.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ─── Import batch from scrape ─────────────────────────────────────────────────
outreachRouter.post("/prospects/import", async (req, res, next) => {
  try {
    const { prospects } = req.body;
    if (!Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({ error: "prospects array krävs" });
    }
    let imported = 0;
    let skipped = 0;
    for (const p of prospects) {
      if (!p.companyName?.trim()) continue;
      try {
        await prisma.outreachProspect.create({
          data: {
            companyName: p.companyName.trim(),
            website: p.website?.trim() || null,
            phone: p.phone?.trim() || null,
            region: p.region?.trim() || null,
            city: p.city?.trim() || null,
            source: p.source || "hitta",
            status: "NEW",
          },
        });
        imported++;
      } catch (_) {
        skipped++;
      }
    }
    res.json({ imported, skipped });
  } catch (e) { next(e); }
});

// ─── Scrape Hitta.se for transport companies ──────────────────────────────────
outreachRouter.post("/scrape", async (req, res, next) => {
  try {
    const { region, query = "åkeri" } = req.body;
    if (!region) return res.status(400).json({ error: "region krävs" });

    const anthropic = getAnthropic();
    const searchUrl = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(query)}&var=${encodeURIComponent(region)}`;

    let html = "";
    try {
      const resp = await fetch(searchUrl, {
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        },
      });
      html = await resp.text();
    } catch (e) {
      return res.status(502).json({ error: `Kunde inte nå Hitta.se: ${e?.message || String(e)}` });
    }

    if (!html || html.length < 200) {
      return res.status(502).json({ error: "Hitta.se returnerade tomt svar" });
    }

    const text = stripHtml(html).slice(0, 12000);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Nedan är textinnehållet från en sökresultatsida på Hitta.se för "${query}" i ${region}, Sverige.

Extrahera alla företag du hittar och returnera dem som ett JSON-array. För varje företag inkludera:
- companyName (string, krävs)
- phone (string eller null)
- website (string med https:// eller null)
- city (string eller null)

Returnera ENDAST ett JSON-array utan annan text.

---
${text}`,
      }],
    });

    let companies = [];
    try {
      const raw = (message.content?.[0]?.text ?? '').trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) companies = JSON.parse(match[0]);
    } catch (_) {
      return res.status(422).json({ error: "Kunde inte tolka sidans innehåll — försök igen" });
    }

    companies = companies
      .filter((c) => c?.companyName)
      .map((c) => ({ ...c, region, source: "hitta" }));

    res.json({ companies, region, query, count: companies.length });
  } catch (e) { next(e); }
});

// ─── Enrich: scrape website → Claude extracts email ──────────────────────────
outreachRouter.post("/enrich/:id", async (req, res, next) => {
  try {
    const prospect = await prisma.outreachProspect.findUnique({ where: { id: req.params.id } });
    if (!prospect) return res.status(404).json({ error: "Prospect hittades inte" });
    if (!prospect.website) return res.status(400).json({ error: "Ingen webbadress — lägg till webbadress först" });

    const anthropic = getAnthropic();

    const base = prospect.website.replace(/\/$/, "");
    const urlsToTry = [`${base}/kontakt`, `${base}/om-oss`, `${base}/contact`, base];

    let html = "";
    for (const url of urlsToTry) {
      try {
        const resp = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; STP-bot/1.0)" },
        });
        if (resp.ok) { html = await resp.text(); break; }
      } catch (_) { continue; }
    }

    if (!html) return res.status(502).json({ error: "Kunde inte nå webbplatsen" });

    const text = stripHtml(html).slice(0, 5000);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Extrahera kontaktinformation från detta textinnehåll.
Returnera ENDAST ett JSON-objekt:
{"email": "..." | null, "phone": "..." | null}

${text}`,
      }],
    });

    let contact = { email: null, phone: null };
    try {
      const raw = (message.content?.[0]?.text ?? '').trim();
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) contact = JSON.parse(match[0]);
    } catch (_) {}

    const updated = await prisma.outreachProspect.update({
      where: { id: prospect.id },
      data: {
        email: contact.email || prospect.email,
        phone: contact.phone || prospect.phone,
        enrichedAt: new Date(),
        status: (contact.email || prospect.email) ? "ENRICHED" : prospect.status,
      },
    });

    res.json(updated);
  } catch (e) { next(e); }
});

// ─── Generate outreach email with Claude ──────────────────────────────────────
outreachRouter.post("/generate/:id", async (req, res, next) => {
  try {
    const prospect = await prisma.outreachProspect.findUnique({ where: { id: req.params.id } });
    if (!prospect) return res.status(404).json({ error: "Prospect hittades inte" });

    const anthropic = getAnthropic();

    const [driverCount, activeJobs] = await Promise.all([
      prisma.driverProfile.count({
        where: {
          visibleToCompanies: true,
          ...(prospect.region ? { region: prospect.region } : {}),
        },
      }),
      prisma.job.count({
        where: {
          status: "ACTIVE",
          ...(prospect.region ? { region: prospect.region } : {}),
        },
      }),
    ]);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      messages: [{
        role: "user",
        content: `Skriv ett kort, personligt cold-email på svenska till ett åkeriföretag som uppmuntrar dem att registrera sig på Sveriges Transportplattform (transportplattformen.se).

Företag: ${prospect.companyName}
Stad: ${prospect.city || "okänd"}
Region: ${prospect.region || "Sverige"}

Plattformsfakta:
- ${driverCount} aktiva förare i${prospect.region ? ` ${prospect.region}` : " Sverige"} söker just nu
- ${activeJobs} aktiva jobbannonser${prospect.region ? ` i regionen` : ""}
- Gratis att registrera och posta jobb
- Direkt kontakt med CE/C-förare, ingen rekryteringsavgift

Regler:
- Max 120 ord
- Naturlig, professionell ton — inte säljig
- Börja med "Hej [${prospect.companyName}],"
- Avsluta med CTA: transportplattformen.se/registrera
- Signera: Oliver Harburt, Grundare — Sveriges Transportplattform

Format (exakt):
ÄMNE: [ämnesraden]
---
[brödtexten]`,
      }],
    });

    const raw = (message.content?.[0]?.text ?? '').trim();
    const subjectMatch = raw.match(/ÄMNE:\s*(.+)/);
    const bodyMatch = raw.match(/---\n([\s\S]+)/);

    const subject = subjectMatch ? subjectMatch[1].trim()
      : `Hitta CE-förare i ${prospect.region || "Sverige"} – Transportplattformen`;
    const body = bodyMatch ? bodyMatch[1].trim() : raw;

    const updated = await prisma.outreachProspect.update({
      where: { id: prospect.id },
      data: {
        generatedSubject: subject,
        generatedEmail: body,
        status: prospect.email ? "READY" : prospect.status,
      },
    });

    res.json(updated);
  } catch (e) { next(e); }
});

// ─── Manual agent trigger ─────────────────────────────────────────────────────
outreachRouter.post("/run-agent", async (req, res, next) => {
  try {
    const { dryRun = false, regions } = req.body;
    // Run async — don't block the HTTP response
    runOutreachAgent({ dryRun, regions }).catch((e) =>
      console.error("[OutreachAgent] Manual trigger error:", e.message)
    );
    res.json({
      ok: true,
      message: dryRun
        ? "Dry run startad — kontrollera server-loggar för resultat."
        : "Agent startad — du får en rapport via e-post när den är klar.",
      dryRun,
    });
  } catch (e) { next(e); }
});

// ─── Send outreach email ──────────────────────────────────────────────────────
outreachRouter.post("/send/:id", async (req, res, next) => {
  try {
    const prospect = await prisma.outreachProspect.findUnique({ where: { id: req.params.id } });
    if (!prospect) return res.status(404).json({ error: "Prospect hittades inte" });
    if (!prospect.email) return res.status(400).json({ error: "Ingen e-postadress — berika prospect först" });
    if (!prospect.generatedEmail) return res.status(400).json({ error: "Generera e-post innan du skickar" });
    if (prospect.status === "SENT") return res.status(400).json({ error: "E-post redan skickad till denna prospect" });

    const replyTo = process.env.OUTREACH_REPLY_TO
      || process.env.ADMIN_EMAILS?.split(",")[0]?.trim()
      || undefined;

    await sendEmail({
      to: prospect.email,
      subject: prospect.generatedSubject || `Hitta förare i ${prospect.region || "Sverige"} – Transportplattformen`,
      text: prospect.generatedEmail,
      replyTo,
    });

    const updated = await prisma.outreachProspect.update({
      where: { id: prospect.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    res.json(updated);
  } catch (e) { next(e); }
});
