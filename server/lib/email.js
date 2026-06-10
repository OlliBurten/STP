import { renderEmail } from "./emailRender.js";

/** Splits plain-text body into paragraphs for the branded React Email layout. */
function toParagraphs(text) {
  return String(text || "").trim().split(/\n{2,}/).filter(Boolean);
}

/**
 * Email notifications.
 * - Uses Resend when RESEND_API_KEY exists.
 * - Falls back to console logging when provider is not configured.
 * @param {string} [params.devInviteUrl] – Om satt och e-post inte skickas: loggas hela URL:en (för teaminbjudan i dev).
 * @returns {Promise<boolean>} true if email was sent via provider, false if only logged (not sent).
 */
export async function sendEmail({ to, subject, text, heading, html: htmlOverride, ctaUrl, ctaText, devInviteUrl, replyTo: replyToOverride }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "noreply@transportplattformen.se";
  const fromName = process.env.EMAIL_FROM_NAME || "Sveriges Transportplattform";
  const from = `${fromName} <${fromAddress}>`;
  const replyTo = replyToOverride || process.env.EMAIL_REPLY_TO;

  if (apiKey) {
    const body = {
      from,
      to: [to],
      subject,
      text,
      html: htmlOverride || (await renderEmail({ preview: subject, heading, paragraphs: toParagraphs(text), ctaUrl, ctaText })),
      ...(replyTo && { reply_to: replyTo }),
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Email provider error (${res.status}): ${body}`);
    }
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[Email:CRITICAL] RESEND_API_KEY is not set. Verification and other emails are NOT sent. Set RESEND_API_KEY and EMAIL_FROM in your backend environment."
    );
  }
  if (process.env.NODE_ENV !== "test") {
    console.log("[Email:FALLBACK_LOG]", { to, subject, emailSent: false });
    if (devInviteUrl) {
      console.log("[Email:INVITE_ACCEPT_URL]", devInviteUrl);
    } else if (text) {
      console.log("[Email:FALLBACK_BODY_PREVIEW]", `${text.slice(0, 200)}${text.length > 200 ? "…" : ""}`);
    }
  }
  return false;
}

export async function notifyNewApplication({ companyEmail, driverName, jobTitle, conversationUrl }) {
  await sendEmail({
    to: companyEmail,
    subject: `Ny ansökan: ${driverName} – ${jobTitle}`,
    heading: "Ny ansökan",
    text: `Hej,\n\n${driverName} har skickat en ansökan till "${jobTitle}" på Sveriges Transportplattform.`,
    ctaUrl: conversationUrl || undefined,
    ctaText: conversationUrl ? "Svara på ansökan" : undefined,
  });
}

export async function notifyNewMessage({ toEmail, fromName, preview, conversationUrl }) {
  await sendEmail({
    to: toEmail,
    subject: `Nytt meddelande från ${fromName}`,
    heading: "Nytt meddelande",
    text: `Hej,\n\nDu har fått ett nytt meddelande från ${fromName}.\n\n"${preview}"`,
    ctaUrl: conversationUrl || undefined,
    ctaText: conversationUrl ? "Svara på meddelandet" : undefined,
  });
}

export async function notifyDriverSelected({ driverEmail, companyName, jobTitle, conversationUrl }) {
  await sendEmail({
    to: driverEmail,
    subject: `Du är utvald – ${jobTitle}`,
    heading: "Du är utvald 🎉",
    text: `Hej,\n\n${companyName} har markerat dig som utvald för jobbet "${jobTitle}".`,
    ctaUrl: conversationUrl || undefined,
    ctaText: conversationUrl ? "Gå till konversationen" : undefined,
  });
}

export async function notifyRecommendedJobMatch({ driverEmail, driverName, jobs = [] }) {
  if (!jobs.length) return;
  const lines = jobs
    .slice(0, 5)
    .map((job, idx) => `${idx + 1}. ${job.title} – ${job.company} (${job.region})`)
    .join("\n");
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  await sendEmail({
    to: driverEmail,
    subject: `Nya jobb som matchar din profil`,
    heading: "Nya jobb för dig",
    text: `Hej ${driverName || ""},\n\nVi hittade ${jobs.length} jobb som matchar din profil:\n\n${lines}\n\nLogga in för att se detaljer och ansöka.`,
    ctaUrl: base ? `${base}/jobb` : undefined,
    ctaText: base ? "Se jobben" : undefined,
  });
}

export async function notifyRecommendedDriverMatch({
  companyEmail,
  companyName,
  driverName,
  driverRegion,
  jobTitles = [],
}) {
  const lines = jobTitles.slice(0, 5).map((title, idx) => `${idx + 1}. ${title}`).join("\n");
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  await sendEmail({
    to: companyEmail,
    subject: `Ny förare matchar era jobb`,
    heading: "Ny förare matchar era jobb",
    text: `Hej ${companyName || ""},\n\nEn förare som matchar era jobb är nu aktiv:\n\nFörare: ${driverName}\nRegion: ${driverRegion || "Ej angiven"}\n\nMatchar bland annat:\n${lines || "- Era aktiva jobb"}\n\nLogga in för att se profilen och kontakta föraren.`,
    ctaUrl: base ? `${base}/foretag/chaufforer` : undefined,
    ctaText: base ? "Se föraren" : undefined,
  });
}

/** Skickas till åkeriet när admin har godkänt företaget (companyStatus → VERIFIED). */
export async function notifyCompanyApproved({ to, companyName }) {
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  await sendEmail({
    to,
    subject: "Ert företag är godkänt – Sveriges Transportplattform",
    heading: "Ert företag är godkänt ✓",
    text: `Hej${companyName ? ` ${companyName}` : ""},\n\nErt företagskonto är nu godkänt. Ni kan publicera jobb och kontakta förare direkt.`,
    ctaUrl: base ? `${base}/foretag` : undefined,
    ctaText: base ? "Kom igång" : undefined,
  });
}

/** Skickas till admin-adresser när någon ny registrerar sig (förare eller åkeri). */
export async function notifyAdminNewRegistration({ role, name, email, companyName, companyOrgNumber }) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return;
  const frontendUrl = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  const adminLink = frontendUrl ? `${frontendUrl}/admin` : "";

  if (role === "COMPANY") {
    const subject = `Åtgärda: Nytt åkeri väntar verifiering – ${companyName || name || email}`;
    const orgLine = companyOrgNumber ? `Org.nr: ${companyOrgNumber}\n` : "";
    const body = `Ett nytt åkeri har registrerat sig och väntar på manuell verifiering.\n\n`
      + `Företag: ${companyName || "(ej angivet)"}\n`
      + `Namn: ${name}\n`
      + `E-post: ${email}\n`
      + orgLine
      + `\nGå in i Admin och godkänn företaget för att låta dem publicera jobb och kontakta förare.`
      + (adminLink ? `\n\n${adminLink}` : "");
    for (const to of adminEmails) {
      try {
        await sendEmail({ to, subject, text: body });
      } catch (e) {
        console.error("[Email] notifyAdminNewRegistration failed for", to, e?.message);
      }
    }
  } else {
    const subject = `Ny registrering: Förare – ${name || email}`;
    const body = `Ny förarregistrering.\n\nNamn: ${name}\nE-post: ${email}\n\n`
      + (adminLink ? `Admin: ${adminLink}` : "Logga in i Admin för att se användarlistan.");
    for (const to of adminEmails) {
      try {
        await sendEmail({ to, subject, text: body });
      } catch (e) {
        console.error("[Email] notifyAdminNewRegistration failed for", to, e?.message);
      }
    }
  }
}

/**
 * Skickar inbjudan till teammedlem.
 * @param {object} params
 * @param {string} params.to - Mottagarens e-post
 * @param {string} params.companyName - Företagets namn
 * @param {string} params.inviteToken - Raw token (för länk)
 * @param {string} [params.frontendBaseUrl] - Base URL (t.ex. https://transportplattformen.se)
 */
export async function sendInviteEmail({ to, companyName, inviteToken, frontendBaseUrl }) {
  const base = (frontendBaseUrl || process.env.FRONTEND_URL?.split(",")[0]?.trim().replace(/\/$/, "") || "").trim();
  const inviteLink = base ? `${base}/invite/accept?token=${encodeURIComponent(inviteToken)}` : "";

  const text =
    `Hej,\n\n` +
    `Du är inbjuden till ${companyName} på Sveriges Transportplattform.\n\n` +
    (inviteLink
      ? `Klicka på knappen nedan för att acceptera och skapa ett konto (eller logga in om du redan har ett).`
      : "Logga in på plattformen och använd inbjudningslänken du fått.") +
    `\n\nLänken gäller i 7 dagar.`;

  const emailSent = await sendEmail({
    to,
    subject: `Inbjudan till ${companyName} – Sveriges Transportplattform`,
    heading: `Inbjudan till ${companyName}`,
    text,
    ctaUrl: inviteLink || undefined,
    ctaText: inviteLink ? "Acceptera inbjudan" : undefined,
    devInviteUrl: inviteLink || undefined,
  });
  return { emailSent, inviteLink };
}

/** Välkomstmail till ny användare direkt efter registrering. */
export async function sendWelcomeEmail({ to, name, role, frontendBaseUrl }) {
  const base = (frontendBaseUrl || process.env.FRONTEND_URL?.split(",")[0]?.trim().replace(/\/$/, "") || "").trim();
  const isDriver = String(role || "").toUpperCase() === "DRIVER";
  const subject = "Välkommen till Sveriges Transportplattform";
  if (isDriver) {
    await sendEmail({
      to,
      subject,
      heading: "Välkommen till STP!",
      text: `Hej ${name || ""}!\n\nVälkommen till Sveriges Transportplattform. Ditt konto är skapat.\n\nFyll i din profil med körkort, region och tillgänglighet så kan rätt åkerier hitta dig direkt.`,
      ctaUrl: base ? `${base}/profil` : undefined,
      ctaText: "Gå till din profil",
    });
  } else {
    await sendEmail({
      to,
      subject,
      heading: "Välkommen till STP!",
      text: `Hej ${name || ""}!\n\nVälkommen till Sveriges Transportplattform. Ert konto är skapat och väntar på verifiering.\n\nVi granskar nya företagskonton manuellt. Det tar vanligtvis 1–2 vardagar. Vi hör av oss när ni är verifierade och kan börja publicera jobb.`,
      ctaUrl: base ? `${base}/foretag` : undefined,
      ctaText: "Gå till er sida",
    });
  }
}

/** Bekräftelsemail till föraren när en ansökan har skickats. */
export async function notifyApplicationConfirmation({ driverEmail, driverName, jobTitle, companyName, conversationUrl }) {
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  await sendEmail({
    to: driverEmail,
    subject: `Ansökan skickad – ${jobTitle}`,
    heading: "Ansökan skickad ✓",
    text: `Hej ${driverName || ""}!\n\nDin ansökan till "${jobTitle}" hos ${companyName} har skickats. Företaget kontaktar dig via plattformen om de är intresserade.`,
    ctaUrl: conversationUrl || (base ? `${base}/meddelanden` : undefined),
    ctaText: "Se konversationen",
  });
}

/** Säkerhetsmail när ett lösenord har ändrats. */
export async function notifyPasswordChanged({ to, name }) {
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "") || "";
  await sendEmail({
    to,
    subject: "Ditt lösenord har ändrats",
    heading: "Lösenordet ändrat",
    text: `Hej ${name || ""}!\n\nDitt lösenord på Sveriges Transportplattform ändrades precis. Om det var du behöver du inte göra något.\n\nOm du inte gjort detta, kontakta oss omedelbart på hello@transportplattformen.se.`,
    ctaUrl: base ? `${base}/login` : undefined,
    ctaText: "Gå till inloggning",
  });
}

/** 30-dagars tips-mail till företaget med annonsstatistik och förslag på förbättringar. */
export async function notifyJobTips({ to, companyName, jobTitle, jobId, viewCount, applicationCount, frontendBaseUrl }) {
  const base = (frontendBaseUrl || process.env.FRONTEND_URL?.split(",")[0]?.trim().replace(/\/$/, "") || "").trim();
  const jobUrl = base ? `${base}/foretag/mina-jobb` : "";
  const tips = [];
  if (!applicationCount || applicationCount < 3) tips.push("Lägg till fler detaljer om tjänsten — lön, arbetstider och specifika krav ökar antalet ansökningar.");
  if (!viewCount || viewCount < 20) tips.push("Se till att rätt segment och region är ifyllt så matchar annonsen fler förare i söket.");
  tips.push("En tydlig kontaktperson och ett kort välkomnande i beskrivningen gör att fler förare väljer att söka.");
  const tipsText = tips.map((t, i) => `${i + 1}. ${t}`).join("\n");
  await sendEmail({
    to,
    subject: `Din annons "${jobTitle}" — 30 dagar och tips för fler ansökningar`,
    text: `Hej ${companyName || ""}!\n\nDin annons "${jobTitle}" har nu varit aktiv i 30 dagar.\n\nStatistik:\n  Visningar: ${viewCount ?? 0}\n  Ansökningar: ${applicationCount ?? 0}\n\nTips för att få fler sökande:\n${tipsText}\n\nAnnonsen är aktiv i ytterligare 30 dagar. Vill du förnya den eller redigera innehållet kan du göra det när som helst.`,
    ctaUrl: jobUrl || undefined,
    ctaText: jobUrl ? "Gå till mina annonser" : undefined,
  });
}

/** Varningsmail 5 dagar innan annonsen auto-arkiveras (dag 55). */
export async function notifyJobExpiring({ to, companyName, jobTitle, jobId, frontendBaseUrl }) {
  const base = (frontendBaseUrl || process.env.FRONTEND_URL?.split(",")[0]?.trim().replace(/\/$/, "") || "").trim();
  const renewUrl = base ? `${base}/foretag/mina-jobb` : "";
  await sendEmail({
    to,
    subject: `Din annons "${jobTitle}" stängs om 5 dagar`,
    text: `Hej ${companyName || ""}!\n\nDin annons "${jobTitle}" har varit aktiv i 55 dagar och stängs automatiskt om 5 dagar.\n\nOm tjänsten fortfarande är aktuell kan du förnya annonsen med ett klick — den får ett nytt publiceringsdatum och visas högre upp i söket.`,
    ctaUrl: renewUrl || undefined,
    ctaText: renewUrl ? "Förnya annonsen" : undefined,
  });
}

/** Mail när en annons auto-arkiverats efter 60 dagar. */
export async function notifyJobAutoArchived({ to, companyName, jobTitle, frontendBaseUrl }) {
  const base = (frontendBaseUrl || process.env.FRONTEND_URL?.split(",")[0]?.trim().replace(/\/$/, "") || "").trim();
  const jobUrl = base ? `${base}/foretag/mina-jobb` : "";
  await sendEmail({
    to,
    subject: `Din annons "${jobTitle}" har stängts av automatiskt`,
    text: `Hej ${companyName || ""}!\n\nDin annons "${jobTitle}" har nu varit aktiv i 60 dagar och har stängts av automatiskt.\n\nOm tjänsten fortfarande är ledig kan du aktivera annonsen igen från Mina annonser. Den får då ett nytt publiceringsdatum.`,
    ctaUrl: jobUrl || undefined,
    ctaText: jobUrl ? "Gå till mina annonser" : undefined,
  });
}

/** Skickar användarfeedback till admin (för in-app feedback-formulär). */
export async function sendFeedbackToAdmin({ message, senderEmail, senderName }) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return;

  const fromLabel = senderEmail
    ? (senderName ? `${senderName} <${senderEmail}>` : senderEmail)
    : "ej angiven";
  const subject = senderEmail
    ? `Feedback från ${senderEmail}`
    : "Feedback från plattformen";
  const text = `Feedback från plattformen:\n\n${message}\n\n---\nAvsändare: ${fromLabel}\n\n${senderEmail ? "Svara på det här mailet för att kontakta användaren direkt." : ""}`;

  for (const to of adminEmails) {
    try {
      await sendEmail({ to, subject, text, ...(senderEmail && { replyTo: senderEmail }) });
    } catch (e) {
      console.error("[Email] sendFeedbackToAdmin failed for", to, e?.message);
    }
  }
}
