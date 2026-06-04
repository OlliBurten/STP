import { useState } from "react";
import { SWE_LAN_PATHS, SWE_LAN_BOX } from "../data/swedenGeo";

const SWE_VIEW = { x: 0, y: 0, w: 290, h: 660 };
const PATHS = SWE_LAN_PATHS || {};
const BOX   = SWE_LAN_BOX   || {};
const ALL_CODES = Object.keys(PATHS);

const LegendRow = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 12, height: 12, borderRadius: 6, background: color, flexShrink: 0 }}/>
    <span style={{ fontSize: 11.5, color: "var(--ink-700)", fontWeight: 500 }}>{label}</span>
  </div>
);

const SwedenJobMap = ({ regions = [], onPickRegion = () => {}, height = 580 }) => {
  const [hover, setHover] = useState(null);

  const byCode = {};
  regions.forEach(r => { byCode[r.code] = r; });
  const maxJobs = Math.max(1, ...regions.map(r => r.jobs));

  const centroid = (code) => {
    const b = BOX[code];
    return b ? { x: b.cx, y: b.cy } : { x: 145, y: 330 };
  };

  const radiusFor = (jobs) => 7 + (jobs / maxJobs) * 10;
  const fillFor   = (jobs) => 0.45 + (jobs / maxJobs) * 0.5;
  const hovered   = hover ? byCode[hover] : null;
  const hoverPin  = hovered ? centroid(hovered.code) : null;

  return (
    <div style={{
      position: "relative", width: "100%", height,
      background: "var(--card)", border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--sh-sm)", overflow: "hidden",
    }}>
      {/* Dot grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
        backgroundSize: "22px 22px", opacity: 0.5, pointerEvents: "none",
      }}/>

      {/* Legend */}
      <div style={{
        position: "absolute", top: 16, left: 18, zIndex: 3,
        display: "flex", flexDirection: "column", gap: 8,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px",
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2,
          textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 2,
        }}>Lediga jobb</div>
        <LegendRow color="var(--green)" label="Fler jobb = större bubbla" />
        <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 2, maxWidth: 132, lineHeight: 1.4 }}>
          Klicka på ett län för att filtrera.
        </div>
      </div>

      {/* SVG map */}
      <svg
        viewBox={`${SWE_VIEW.x} ${SWE_VIEW.y} ${SWE_VIEW.w} ${SWE_VIEW.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* County fills */}
        {ALL_CODES.map(code => {
          const active = !!byCode[code];
          const isHover = hover === code;
          const fill = active
            ? (isHover ? "var(--green-tint-2, #d4ede1)" : "var(--green-tint)")
            : "var(--paper-2)";
          return (
            <path
              key={code}
              d={PATHS[code]}
              fill={fill}
              stroke={active && isHover ? "var(--green)" : "var(--line-2)"}
              strokeWidth={active && isHover ? "1.6" : "0.6"}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              style={{ cursor: active ? "pointer" : "default", transition: "fill .15s, stroke .15s" }}
              onMouseEnter={() => active && setHover(code)}
              onMouseLeave={() => active && setHover(null)}
              onClick={() => { if (active) onPickRegion(byCode[code]); }}
            />
          );
        })}

        {/* Job bubbles at county centroids */}
        {regions.map(r => {
          const c = centroid(r.code);
          const rad = radiusFor(r.jobs);
          const isHover = hover === r.code;
          const nudge = r.nudge || { x: 0, y: 0 };
          const bx = c.x + nudge.x;
          const by = c.y + nudge.y;
          return (
            <g
              key={r.code}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(r.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onPickRegion(r)}
            >
              {r.matches > 0 && (
                <circle cx={bx} cy={by} r={rad + 4} fill="none" stroke="var(--amber)"
                  strokeWidth="2" opacity="0.5" vectorEffect="non-scaling-stroke">
                  <animate attributeName="r" values={`${rad+1};${rad+7};${rad+1}`} dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle
                cx={bx} cy={by} r={rad}
                fill="var(--green)"
                fillOpacity={isHover ? 0.97 : fillFor(r.jobs)}
                stroke="#fff" strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                style={{ transition: "fill-opacity .15s" }}
              />
              <text
                x={bx} y={by}
                textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontWeight="800"
                fontSize={rad > 13 ? 10 : 8}
                fontFamily="var(--mono)"
                style={{ pointerEvents: "none" }}
              >{r.jobs}</text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && hoverPin && (
        <div style={{
          position: "absolute",
          left: `${((hoverPin.x + (hovered.nudge?.x ?? 0)) / SWE_VIEW.w) * 100}%`,
          top:  `${((hoverPin.y + (hovered.nudge?.y ?? 0)) / SWE_VIEW.h) * 100}%`,
          transform: "translate(-50%, calc(-100% - 18px))",
          zIndex: 4, pointerEvents: "none",
          background: "var(--ink-900)", color: "#fff",
          borderRadius: 10, padding: "10px 14px", boxShadow: "var(--sh-md)",
          minWidth: 140, whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{hovered.name}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{hovered.jobs}</span> lediga jobb
          </div>
        </div>
      )}
    </div>
  );
};

export default SwedenJobMap;
