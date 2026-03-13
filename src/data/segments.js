export const segmentOptions = [
  { value: "FULLTIME", label: "Heltid", description: "Fast anställning" },
  { value: "FLEX", label: "Vikariepool", description: "Vikariat, deltid, extra pass" },
  { value: "INTERNSHIP", label: "Praktik", description: "Praktik, APV m.fl." },
];

export function segmentLabel(segment) {
  return segmentOptions.find((s) => s.value === segment)?.label || "Okänt segment";
}

export function segmentDescription(segment) {
  return segmentOptions.find((s) => s.value === segment)?.description || "";
}

export function mapEmploymentToSegment(employment) {
  if (employment === "fast") return "FULLTIME";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}
