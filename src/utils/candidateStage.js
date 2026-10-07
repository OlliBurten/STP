// Kandidatens steg i rekryteringen — samma regler som servern (companies.js candidateStage).
// Ett uttryckligt satt steg (pipelineStage) går före tidsstämplarna.
const PIPELINE_TO_STAGE = { ny: "new", kontaktad: "reviewing", intervjuad: "interview", anstalld: "hired", avslag: "rejected" };

export function candidateStage(c) {
  if (PIPELINE_TO_STAGE[c?.pipelineStage]) return PIPELINE_TO_STAGE[c.pipelineStage];
  if (c?.rejectedByCompanyAt) return "rejected";
  if (c?.selectedByCompanyAt) return "interview";
  if (c?.readByCompanyAt || c?.reviewedByCompanyAt) return "reviewing";
  return "new";
}
