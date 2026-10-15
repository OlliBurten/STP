/**
 * Engångsskript: bygg upp händelseloggen (RecruitmentEvent) för konversationer som
 * fanns innan loggen infördes 2026-10-15. Idempotent — hoppar över konversationer
 * som redan har händelser.
 * Kör: DATABASE_URL=... node scripts/backfill-recruitment-events.mjs [--dry]
 */
import { prisma } from "../lib/prisma.js";

const dry = process.argv.includes("--dry");
const convs = await prisma.conversation.findMany({
  select: {
    id: true, jobId: true, organizationId: true, companyId: true, driverId: true,
    createdAt: true, selectedByCompanyAt: true, rejectedByCompanyAt: true, pipelineStage: true,
    messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, senderId: true, createdAt: true } },
  },
});
let created = 0;
for (const c of convs) {
  const has = await prisma.recruitmentEvent.count({ where: { conversationId: c.id } });
  if (has) continue;
  const base = { conversationId: c.id, jobId: c.jobId, organizationId: c.organizationId, companyId: c.companyId, driverId: c.driverId, source: "backfill" };
  const rows = [];
  const first = c.messages[0];
  if (first) rows.push({ ...base, type: first.senderRole === "company" ? "CONTACTED" : "APPLIED", actorRole: first.senderRole, actorId: first.senderId, createdAt: first.createdAt });
  const reply = first && c.messages.find((m) => m.senderRole !== first.senderRole);
  if (reply) rows.push({ ...base, type: reply.senderRole === "company" ? "COMPANY_REPLIED" : "DRIVER_REPLIED", actorRole: reply.senderRole, actorId: reply.senderId, createdAt: reply.createdAt });
  if (c.selectedByCompanyAt) rows.push({ ...base, type: "INTERVIEW", actorRole: "company", createdAt: c.selectedByCompanyAt });
  if (c.rejectedByCompanyAt) rows.push({ ...base, type: "REJECTED", actorRole: "company", createdAt: c.rejectedByCompanyAt });
  if (!dry && rows.length) await prisma.recruitmentEvent.createMany({ data: rows });
  created += rows.length;
}
console.log(`${dry ? "[torrkörning] " : ""}${convs.length} konversationer, ${created} händelser`);
await prisma.$disconnect();
