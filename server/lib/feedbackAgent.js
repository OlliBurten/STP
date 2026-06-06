/**
 * Feedback AI Agent
 * Analyserar inkommande feedback med Claude:
 * - Kategoriserar och prioriterar
 * - Sparar i databasen
 * - Skickar auto-svar till användaren
 */
import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "./email.js";
import { prisma } from "./prisma.js";

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Analyserar feedback, sparar i DB och skickar auto-svar till användaren.
 * Körs asynkront — blockerar inte feedback-POST-svaret.
 */
export async function processFeedback(feedbackId) {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) return;

    const anthropic = getAnthropic();

    // Steg 1: Haiku kategoriserar och prioriterar snabbt
    const analysisMsg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Du analyserar feedback till Sveriges Transportplattform (STP) — en jobbplattform för lastbilsförare och åkerier.

FEEDBACK: "${feedback.message}"

Svara i exakt detta format:
PRIORITET: [HIGH|MEDIUM|LOW]
KATEGORI: [BUG|FUNKTION|UX|INNEHÅLL|KONTO|ÖVRIGT]
SAMMANFATTNING: [max 15 ord — vad vill användaren]
ÅTGÄRD: [konkret nästa steg för teamet, max 1 mening]`,
      }],
    });

    const analysis = (analysisMsg.content?.[0]?.text ?? '').trim();
    const priority = analysis.match(/PRIORITET:\s*(HIGH|MEDIUM|LOW)/i)?.[1]?.toUpperCase() || "MEDIUM";
    const category = analysis.match(/KATEGORI:\s*(\w+)/i)?.[1]?.toUpperCase() || "ÖVRIGT";
    const summary = analysis.match(/SAMMANFATTNING:\s*(.+)/i)?.[1]?.trim() || "";
    const action = analysis.match(/ÅTGÄRD:\s*(.+)/i)?.[1]?.trim() || "";

    // Steg 2: Sonnet skriver ett genuint, personligt svar om användaren har email
    let autoReply = "";
    if (feedback.senderEmail) {
      const replyMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Du är Oliver Harburt, grundare av Sveriges Transportplattform — en jobbplattform för lastbilsförare och åkerier. Du svarar personligen på användarfeedback.

FEEDBACK FRÅN ${feedback.senderName ? feedback.senderName : "en användare"}:
"${feedback.message}"

Skriv ett genuint, personligt svar på svenska direkt till den här personen.

Regler:
- Adressera specifikt vad de tog upp — citera eller parafrasera deras poäng
- Om det är en bugg: erkänn problemet och säg att du tittar på det
- Om det är ett förslag: visa att du förstår värdet i det och om det är något du planerar
- Om det är beröm: tacka genuint och konkret för vad de nämner
- Naturlig, varm ton — inte corporate-speak
- Max 4 meningar
- Skriv BARA svaret, ingen hälsning (den läggs till automatiskt), ingen signatur`,
        }],
      });
      autoReply = (replyMsg.content?.[0]?.text ?? '').trim();
    }

    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        priority,
        category,
        aiSummary: summary,
        aiAction: action,
        analyzedAt: new Date(),
      },
    });

    // Skicka auto-svar om vi har användarens email
    if (feedback.senderEmail && autoReply) {
      try {
        await sendEmail({
          to: feedback.senderEmail,
          subject: "Vi har tagit emot din feedback — Sveriges Transportplattform",
          text: `Hej${feedback.senderName ? ` ${feedback.senderName}` : ""},\n\n${autoReply}\n\n— Oliver & teamet på Sveriges Transportplattform\ntransportplattformen.se`,
          replyTo: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || undefined,
        });

        await prisma.feedback.update({
          where: { id: feedbackId },
          data: { autoReplySentAt: new Date() },
        });

        console.log(`[FeedbackAgent] Auto-svar skickat till ${feedback.senderEmail}`);
      } catch (e) {
        console.error("[FeedbackAgent] Kunde inte skicka auto-svar:", e?.message || String(e));
      }
    }

    console.log(`[FeedbackAgent] Feedback ${feedbackId} analyserad — ${priority} / ${category}: ${summary}`);
  } catch (e) {
    console.error("[FeedbackAgent] Fel vid analys av feedback:", e?.message || String(e));
  }
}
