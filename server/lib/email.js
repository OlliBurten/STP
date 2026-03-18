/**
 * Email notifications.
 * - Uses Resend when RESEND_API_KEY exists.
 * - Falls back to console logging when provider is not configured.
 * @returns {Promise<boolean>} true if email was sent via provider, false if only logged (not sent).
 */
export async function sendEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@transportplattformen.se";

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
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
    console.log("[Email:FALLBACK_LOG]", { to, subject, text: text?.slice(0, 120) + "..." });
  }
  return false;
}

export async function notifyNewApplication({ companyEmail, driverName, jobTitle }) {
  await sendEmail({
    to: companyEmail,
    subject: `Ny ansökan: ${driverName} – ${jobTitle}`,
    text: `Hej,\n\n${driverName} har ansökt till jobbet "${jobTitle}". Logga in på DriverMatch för att se profilen och svara.\n\nMed vänliga hälsningar,\nDriverMatch`,
  });
}

export async function notifyNewMessage({ toEmail, fromName, preview }) {
  await sendEmail({
    to: toEmail,
    subject: `Nytt meddelande från ${fromName}`,
    text: `Hej,\n\nDu har fått ett nytt meddelande från ${fromName} på DriverMatch.\n\n"${preview}"\n\nLogga in för att läsa och svara.\n\nMed vänliga hälsningar,\nDriverMatch`,
  });
}

export async function notifyDriverSelected({ driverEmail, companyName, jobTitle }) {
  await sendEmail({
    to: driverEmail,
    subject: `Du är utvald: ${jobTitle}`,
    text: `Hej,\n\n${companyName} har markerat dig som utvald för jobbet "${jobTitle}".\n\nLogga in på DriverMatch och svara i meddelanden för att ta nästa steg.\n\nMed vänliga hälsningar,\nDriverMatch`,
  });
}

export async function notifyRecommendedJobMatch({ driverEmail, driverName, jobs = [] }) {
  if (!jobs.length) return;
  const lines = jobs
    .slice(0, 5)
    .map((job, idx) => `${idx + 1}. ${job.title} – ${job.company} (${job.region})`)
    .join("\n");
  await sendEmail({
    to: driverEmail,
    subject: `Nya jobb som matchar din profil`,
    text: `Hej ${driverName || ""},\n\nVi hittade ${jobs.length} jobb som matchar din profil på DriverMatch:\n\n${lines}\n\nLogga in för att se detaljer och ansöka.\n\nMed vänliga hälsningar,\nDriverMatch`,
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
  await sendEmail({
    to: companyEmail,
    subject: `Ny förare matchar era jobb`,
    text: `Hej ${companyName || ""},\n\nEn förare som matchar era jobb är nu aktiv:\n\nFörare: ${driverName}\nRegion: ${driverRegion || "Ej angiven"}\n\nMatchar bland annat:\n${lines || "- Era aktiva jobb"}\n\nLogga in på DriverMatch för att se profiler och kontakta föraren.\n\nMed vänliga hälsningar,\nDriverMatch`,
  });
}

/** Skickas till åkeriet när admin har godkänt företaget (companyStatus → VERIFIED). */
export async function notifyCompanyApproved({ to, companyName }) {
  await sendEmail({
    to,
    subject: "Ert företag är godkänt – Sveriges Transportplattform",
    text: `Hej${companyName ? ` ${companyName}` : ""},\n\nErt företagskonto är nu godkänt. Ni kan logga in och publicera jobb samt kontakta förare.\n\nLogga in på plattformen för att komma igång.\n\nMed vänliga hälsningar,\nSveriges Transportplattform`,
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
      ? `Klicka på länken för att acceptera och skapa ett konto (eller logga in om du redan har ett):\n\n${inviteLink}\n\n`
      : "Logga in på plattformen och använd inbjudningslänken du fått.\n\n") +
    `Länken gäller i 7 dagar.\n\n` +
    `Med vänliga hälsningar,\nSveriges Transportplattform`;

  await sendEmail({
    to,
    subject: `Inbjudan till ${companyName} – Sveriges Transportplattform`,
    text,
  });
}

/** Skickar användarfeedback till admin (för in-app feedback-formulär). */
export async function sendFeedbackToAdmin({ message, senderEmail }) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return;
  const subject = "Feedback från plattformen";
  const text = `Feedback:\n\n${message}\n\n${senderEmail ? `Avsändare: ${senderEmail}` : "Avsändare: ej angiven"}`;
  for (const to of adminEmails) {
    try {
      await sendEmail({ to, subject, text });
    } catch (e) {
      console.error("[Email] sendFeedbackToAdmin failed for", to, e?.message);
    }
  }
}
