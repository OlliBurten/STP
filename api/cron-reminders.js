/**
 * Vercel Cron: Skickar verifieringspåminnelser till overifierade användare.
 * Triggas automatiskt dagligen kl 09:00 UTC.
 *
 * Kräver i Vercel:
 * - VITE_API_URL (eller BACKEND_URL) = backend-URL t.ex. https://nodejs-production-f3b9.up.railway.app
 * - ADMIN_API_KEY = samma som i Railway (för att autentisera mot backend)
 */
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  const apiKey = process.env.ADMIN_API_KEY;
  const backendUrl = (process.env.VITE_API_URL || process.env.BACKEND_URL || "").trim().replace(/\/$/, "");

  if (!apiKey || !backendUrl) {
    console.error("[cron-reminders] ADMIN_API_KEY eller VITE_API_URL saknas");
    return res.status(500).json({
      error: "Cron ej konfigurerad",
      hint: "Sätt ADMIN_API_KEY och VITE_API_URL i Vercel Environment Variables",
    });
  }

  try {
    const r = await fetch(`${backendUrl}/api/internal/send-verification-reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": apiKey,
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(55000),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("[cron-reminders] Backend error:", r.status, data);
      return res.status(r.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error("[cron-reminders]", e?.message);
    return res.status(500).json({ error: e?.message || "Kunde inte nå backend" });
  }
}
