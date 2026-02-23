export const segmentOptions = [
  {
    value: "FULLTIME",
    label: "Heltid",
    description: "Långsiktig anställning",
  },
  {
    value: "FLEX",
    label: "Vikariepool",
    description: "Extra pass, pensionärer, deltidsförare",
  },
  {
    value: "INTERNSHIP",
    label: "Praktik",
    description: "Elever och lärlingar",
  },
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
