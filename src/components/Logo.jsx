/**
 * STP – enkel logotyp (endast text).
 * Använd height för att styra storlek.
 * variant="light" för vit text på mörk bakgrund (t.ex. footer).
 */
const VIEWBOX_WIDTH = 80;
const VIEWBOX_HEIGHT = 32;

export default function Logo({ className = "", height = 40, variant = "default" }) {
  const fill = variant === "light" ? "#ffffff" : "#1F5F5C";
  const width = height * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="img"
      aria-label="STP"
      style={{ height: `${height}px`, width: `${width}px`, display: "block" }}
      className={className}
    >
      <text
        x="0"
        y="26"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontWeight="700"
        letterSpacing="-0.02em"
        fontSize="24"
        fill={fill}
      >
        STP
      </text>
    </svg>
  );
}
