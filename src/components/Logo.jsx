/**
 * STP Sveriges Transportplattform – logotyp (STP + swooshes + tagline).
 * Använd height för att styra storlek; bredd skalar automatiskt.
 * variant="light" för ljus logotyp på mörk bakgrund (t.ex. footer).
 */
const LOGO_ASPECT = 1220 / 600; // viewBox width / height

export default function Logo({ className = "", height = 40, variant = "default" }) {
  const isLight = variant === "light";
  const textFill = isLight ? "#ffffff" : "#1F5F5C";
  const width = height * LOGO_ASPECT;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1220 600"
      role="img"
      aria-label="STP Sveriges Transportplattform"
      style={{ height: `${height}px`, width: `${width}px`, minWidth: `${width}px`, overflow: "visible", display: "block" }}
      className={className}
    >
      <g transform="translate(90,95)">
        <text
          x="0"
          y="210"
          fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="-0.02em"
          fontSize="260"
          fill={textFill}
        >
          STP
        </text>
        <g transform="translate(30,255)">
          <path
            d="M 0 95 C 170 155, 360 160, 585 128 C 760 102, 900 78, 1020 58 C 1045 54, 1065 52, 1090 52 C 1045 72, 1000 96, 930 120 C 740 188, 515 206, 310 188 C 170 176, 80 148, 0 95 Z"
            fill={isLight ? "rgba(255,255,255,0.9)" : "#0E4947"}
            opacity="0.98"
          />
          <path
            d="M 70 110 C 225 148, 395 145, 560 120 C 700 98, 830 74, 930 60 C 855 86, 760 118, 635 150 C 470 192, 275 196, 130 168 C 100 162, 85 155, 70 110 Z"
            fill={isLight ? "#D6A21F" : "#D6A21F"}
          />
          <path
            d="M 520 165 C 690 132, 850 104, 1020 66 C 1040 62, 1060 58, 1090 52 C 1030 92, 960 132, 875 162 C 740 210, 610 222, 520 215 C 480 212, 485 188, 520 165 Z"
            fill={isLight ? "rgba(255,255,255,0.85)" : "#7A8D3C"}
            opacity="0.95"
          />
        </g>
        <text
          x="105"
          y="485"
          fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          fontWeight="700"
          letterSpacing="0.18em"
          fontSize="36"
          fill={textFill}
        >
          SVERIGES TRANSPORTPLATTFORM
        </text>
      </g>
    </svg>
  );
}
