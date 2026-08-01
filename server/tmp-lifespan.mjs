import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const DAY = 86400000;
const pct = (a, q) => a.length ? a.slice().sort((x,y)=>x-y)[Math.floor((a.length-1)*q)] : null;

const byStatus = await p.job.groupBy({ by: ["status"], _count: true });
console.log("=== ANNONSER PER STATUS ===");
for (const r of byStatus) console.log(`  ${r.status.padEnd(10)} ${r._count}`);

const bySource = await p.job.groupBy({ by: ["source"], _count: true });
console.log("\n=== PER KÄLLA ===");
for (const r of bySource) console.log(`  ${r.source.padEnd(12)} ${r._count}`);

const now = Date.now();

// Livslängd för annonser som INTE längre är aktiva.
// OBS: updatedAt ändras av all uppdatering (t.ex. AI-berikning), så detta är
// en ÖVRE gräns för livslängden, inte ett exakt mått.
const dead = await p.job.findMany({
  where: { status: { not: "ACTIVE" } },
  select: { createdAt: true, updatedAt: true },
});
const lifes = dead.map(j => (j.updatedAt - j.createdAt) / DAY).filter(d => d >= 0);
console.log(`\n=== LIVSLÄNGD, avpublicerade annonser (n=${lifes.length}) ===`);
if (lifes.length) {
  console.log(`  median: ${pct(lifes,.5).toFixed(1)} dygn`);
  console.log(`  25/75:  ${pct(lifes,.25).toFixed(1)} / ${pct(lifes,.75).toFixed(1)} dygn`);
  console.log(`  andel som dog inom 14 dygn: ${(lifes.filter(d=>d<=14).length/lifes.length*100).toFixed(0)} %`);
  console.log(`  andel som dog inom 30 dygn: ${(lifes.filter(d=>d<=30).length/lifes.length*100).toFixed(0)} %`);
}

// Ålder på nu aktiva annonser
const act = await p.job.findMany({ where: { status: "ACTIVE" }, select: { createdAt: true, applicationDeadline: true } });
const ages = act.map(j => (now - j.createdAt) / DAY);
console.log(`\n=== ÅLDER, nu aktiva annonser (n=${ages.length}) ===`);
console.log(`  median: ${pct(ages,.5).toFixed(1)} dygn   25/75: ${pct(ages,.25).toFixed(1)} / ${pct(ages,.75).toFixed(1)}`);
for (const [lbl, f] of [["≤7 dygn",d=>d<=7],["8–14",d=>d>7&&d<=14],["15–30",d=>d>14&&d<=30],["31+",d=>d>30]])
  console.log(`  ${lbl.padEnd(9)} ${ages.filter(f).length}`);

// Kvarvarande tid enligt AF:s sista ansökningsdag
const dl = act.filter(j => j.applicationDeadline).map(j => (j.applicationDeadline - now) / DAY);
console.log(`\n=== ÅTERSTÅENDE TID enl. sista ansökningsdag (n=${dl.length} av ${act.length}) ===`);
if (dl.length) {
  console.log(`  median: ${pct(dl,.5).toFixed(1)} dygn kvar`);
  console.log(`  går ut inom 14 dygn: ${dl.filter(d=>d<=14&&d>0).length}`);
  console.log(`  redan passerade:     ${dl.filter(d=>d<=0).length}`);
}

// Nyintag per vecka
const recent = await p.job.findMany({ where: { createdAt: { gte: new Date(now - 56*DAY) } }, select: { createdAt: true } });
const wk = {};
for (const j of recent) { const k = new Date(Math.floor(j.createdAt/ (7*DAY)) * 7*DAY).toISOString().slice(0,10); wk[k]=(wk[k]||0)+1; }
console.log("\n=== NYA ANNONSER PER VECKA (8 v) ===");
for (const k of Object.keys(wk).sort().reverse()) console.log(`  ${k}  ${wk[k]}`);

await p.$disconnect();
