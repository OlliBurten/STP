export const segmentOptions = [
  {
    value: "FULLTIME",
    label: "Heltidssökande",
    description: "Långsiktig anställning, fast anställning",
  },
  {
    value: "FLEX",
    label: "Vikariepool",
    description: "Extra pass, vikarier, pensionärer, deltidsförare",
  },
  {
    value: "INTERNSHIP",
    label: "Praktikanter",
    description: "Elever, LIA, lärlingar – t.ex. från gymnasiet",
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
