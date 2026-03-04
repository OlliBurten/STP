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
