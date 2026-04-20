import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Analyze a driver profile summary using Claude.
 * Returns { ok, issues, suggestions } — fast, uses Haiku.
 */
export async function analyzeSummary(text) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `Du är en kvalitetskontroll för en svensk jobbplattform för yrkeschaufförer (lastbil, transport).
Din uppgift är att granska en förares profiltext och ge feedback på svenska.

Svara ALLTID med giltig JSON i detta exakta format:
{
  "ok": true/false,
  "issues": ["problem1", "problem2"],
  "suggestions": ["förbättring1", "förbättring2"]
}

"ok" är true om texten är relevant och lämplig, annars false.
"issues" innehåller konkreta problem (max 3). Tom array om inga problem.
"suggestions" innehåller konkreta förbättringsförslag (max 3). Tom array om inga förslag.

Bedöm:
1. Relevans — handlar texten om transportarbete, körning, erfarenhet eller jobbönskemål? Irrelevant innehåll (recept, politik, slumpmässig text) ska flaggas.
2. Lämplighet — innehåller texten stötande språk, personangrepp eller olämpligt innehåll?
3. Kvalitet — är texten tillräckligt informativ för en rekryterare? Ge förslag om den är för vag.`,
    messages: [
      {
        role: "user",
        content: `Granska denna profiltext:\n\n${text}`,
      },
    ],
  });

  const raw = message.content[0]?.text || "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      ok: Boolean(parsed.ok),
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 3) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    };
  } catch {
    return { ok: true, issues: [], suggestions: [] };
  }
}
