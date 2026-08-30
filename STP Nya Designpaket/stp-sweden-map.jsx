/* ════════════════════════════════════════════════════════════
   STP — Sverige-karta (återanvändbar, zoombar)

   Bygger på officiell läns-geometri (Wikimedia, CC-BY-SA Lokal_Profil)
   som laddas via stp-sweden-geo.js (window.SWE_LAN_PATHS + SWE_LAN_BOX).
   viewBox 0 0 290 660.

   Ladda i denna ordning:
     <script type="text/babel" src="stp-light-components.jsx"></script>
     <script src="stp-sweden-geo.js"></script>
     <script type="text/babel" src="stp-sweden-map.jsx"></script>

   Användning:
     <SwedenJobMap
        regions={REGION_DATA}     // [{ id, code, name, region, jobs, new, matches, cities:[{name,dx,dy,jobs}] }]
        onPickRegion={fn}         // (region) => void
        height={580}
     />
   code = länsbokstav: AB=Stockholm, C=Uppsala, M=Skåne, N=Halland,
          O=Västra Götaland, Y=Västernorrland, osv.

   Exporteras till window.SwedenJobMap.
════════════════════════════════════════════════════════════ */

const SWE_VIEW = { x: 0, y: 0, w: 290, h: 660 };
const PATHS = (typeof window !== "undefined" && window.SWE_LAN_PATHS) || {};
const BOX   = (typeof window !== "undefined" && window.SWE_LAN_BOX)   || {};
const ALL_CODES = Object.keys(PATHS);

const SwedenJobMap = ({ regions = [], onPickRegion = () => {}, height = 580, labels = {} }) => {
  const L = {
    legendTitle: labels.legendTitle || "Lediga jobb",
    sizeNote:    labels.sizeNote    || "Fler jobb = större",
    matchNote:   labels.matchNote   || "Matchar din profil",
    newNote:     labels.newNote     || "Nya idag",
    hint:        labels.hint        || "Klicka på ett län för att zooma in.",
    inCounty:    labels.inCounty    || "lediga jobb i länet",
    unit:        labels.unit        || "lediga jobb",
    matchUnit:   labels.matchUnit   || "matchar dig",
    pickAll:     labels.pickAll     || ((n, name) => `Visa alla ${n} jobb i ${name}`),
  };
  const { useState, useRef, useEffect } = React;
  const [vb, setVb] = useState({ ...SWE_VIEW });
  const [zoomed, setZoomed] = useState(null);
  const [hover, setHover] = useState(null);
  const rafRef = useRef(null);

  const byCode = {};
  regions.forEach(r => { byCode[r.code] = r; });
  const maxJobs = Math.max(1, ...regions.map(r => r.jobs));
  const sizeFactor = vb.w / SWE_VIEW.w;
  const centroid = (code) => { const b = BOX[code]; return b ? { x: b.cx, y: b.cy } : { x: 145, y: 330 }; };

  const animateTo = (target) => {
    cancelAnimationFrame(rafRef.current);
    const start = { ...vb }; const t0 = performance.now(); const dur = 520;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur); const e = ease(p);
      setVb({
        x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e,
        w: start.w + (target.w - start.w) * e, h: start.h + (target.h - start.h) * e,
      });
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const zoomToRegion = (r) => {
    const b = BOX[r.code]; if (!b) return;
    const pad = 0.35;
    let w = b.w * (1 + pad * 2), h = b.h * (1 + pad * 2);
    const aspect = SWE_VIEW.w / SWE_VIEW.h;
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    animateTo({ x: b.cx - w / 2, y: b.cy - h / 2, w, h });
    setZoomed(r); setHover(null);
  };
  const zoomOut = () => { animateTo({ ...SWE_VIEW }); setZoomed(null); setHover(null); };

  const radiusFor = (jobs) => (7 + (jobs / maxJobs) * 9) * sizeFactor;
  const fillFor   = (jobs) => 0.45 + (jobs / maxJobs) * 0.5;
  const hovered   = hover ? byCode[hover] : null;
  const hoverPin  = hovered ? centroid(hovered.code) : null;

  return (
    <div style={{
      position: "relative", width: "100%", height,
      background: "var(--card)", border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--sh-sm)", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
        backgroundSize: "22px 22px", opacity: 0.5, pointerEvents: "none",
      }}/>

      {/* Legend */}
      {!zoomed && (
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
          }}>{L.legendTitle}</div>
          <LegendRow color="var(--green)" label={L.sizeNote} />
          <LegendRow color="var(--amber)" label={L.matchNote} />
          <LegendRow color="var(--success)" label={L.newNote} />
          <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 2, maxWidth: 132, lineHeight: 1.4 }}>
            {L.hint}
          </div>
        </div>
      )}

      {/* Zoomed header */}
      {zoomed && (
        <div style={{
          position: "absolute", top: 16, left: 18, right: 18, zIndex: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>{zoomed.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{zoomed.jobs}</span> {L.inCounty}
            </div>
          </div>
          <button onClick={zoomOut} style={{
            display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
            padding: "9px 14px", borderRadius: 999, background: "var(--ink-900)",
            color: "#fff", fontSize: 12.5, fontWeight: 600, boxShadow: "var(--sh-md)",
          }}>
            <Icon name="arrowLeft" size={13} color="#fff" stroke={2.2}/>
            Visa hela Sverige
          </button>
        </div>
      )}

      {/* MAP */}
      <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* All counties as base map */}
        {ALL_CODES.map(code => {
          const active = !!byCode[code];
          const isZoomTarget = zoomed && zoomed.code === code;
          const isHover = hover === code;
          const fill = isZoomTarget ? "var(--green-tint)"
            : active ? (isHover ? "var(--green-tint-2)" : "var(--green-tint)")
            : "var(--paper-2)";
          return (
            <path key={code} d={PATHS[code]} fill={fill}
              stroke={active && isHover ? "var(--green)" : "var(--line-2)"}
              strokeWidth={active && isHover ? "1.6" : "0.6"} vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              style={{ cursor: active && !zoomed ? "pointer" : "default", transition: "fill .15s, stroke .15s" }}
              onMouseEnter={() => active && !zoomed && setHover(code)}
              onMouseLeave={() => active && !zoomed && setHover(null)}
              onClick={() => { if (active && !zoomed) zoomToRegion(byCode[code]); }}
            />
          );
        })}

        {/* NATIONAL: job bubbles at county centroids */}
        {!zoomed && regions.map(r => {
          const c = centroid(r.code); const rad = radiusFor(r.jobs); const isHover = hover === r.code;
          const nudge = r.nudge || { x: 0, y: 0 };
          const bx = c.x + nudge.x, by = c.y + nudge.y;
          return (
            <g key={r.code} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(r.code)} onMouseLeave={() => setHover(null)}
              onClick={() => zoomToRegion(r)}>
              {r.matches > 0 && (
                <circle cx={bx} cy={by} r={rad + 4} fill="none" stroke="var(--amber)"
                  strokeWidth="2" opacity="0.5" vectorEffect="non-scaling-stroke">
                  <animate attributeName="r" values={`${rad+1};${rad+7};${rad+1}`} dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={bx} cy={by} r={rad} fill="var(--green)"
                fillOpacity={isHover ? 0.97 : fillFor(r.jobs)} stroke="#fff" strokeWidth="1.5"
                vectorEffect="non-scaling-stroke" style={{ transition: "fill-opacity .15s" }}/>
              <text x={bx} y={by} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontWeight="800" fontSize={(rad > 12 ? 11 : 9) }
                fontFamily="var(--mono)" style={{ pointerEvents: "none" }}>{r.jobs}</text>
              {r.new > 0 && (
                <circle cx={bx + rad * 0.72} cy={by - rad * 0.72} r={3.5 * sizeFactor}
                  fill="var(--success)" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
              )}
            </g>
          );
        })}

        {/* ZOOMED: city pins */}
        {zoomed && zoomed.cities.map(ci => {
          const c = centroid(zoomed.code);
          const x = c.x + (ci.dx || 0), y = c.y + (ci.dy || 0);
          const mx = Math.max(...zoomed.cities.map(z => z.jobs));
          const r = (5 + (ci.jobs / mx) * 6) * sizeFactor;
          return (
            <g key={ci.name} style={{ cursor: "pointer" }}
              onClick={() => onPickRegion({ ...zoomed, city: ci })}>
              <circle cx={x} cy={y} r={r + 3 * sizeFactor} fill="var(--green)" opacity="0.15"/>
              <circle cx={x} cy={y} r={r} fill="var(--green)" stroke="#fff"
                strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontWeight="800" fontSize={8 * sizeFactor}
                fontFamily="var(--mono)" style={{ pointerEvents: "none" }}>{ci.jobs}</text>
              <text x={x} y={y + r + 9 * sizeFactor} textAnchor="middle"
                fill="var(--ink-900)" fontWeight="700" fontSize={9 * sizeFactor}
                fontFamily="var(--font)" style={{ pointerEvents: "none" }}>{ci.name}</text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && hoverPin && !zoomed && (
        <div style={{
          position: "absolute",
          left: `${((hoverPin.x + (hovered.nudge ? hovered.nudge.x : 0)) / SWE_VIEW.w) * 100}%`,
          top: `${((hoverPin.y + (hovered.nudge ? hovered.nudge.y : 0)) / SWE_VIEW.h) * 100}%`,
          transform: "translate(-50%, calc(-100% - 18px))",
          zIndex: 4, pointerEvents: "none", background: "var(--ink-900)", color: "#fff",
          borderRadius: 10, padding: "10px 14px", boxShadow: "var(--sh-md)",
          minWidth: 140, whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{hovered.name}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{hovered.jobs}</span> {L.unit}
            {hovered.matches > 0 && (
              <><br/><span style={{ color: "#f5c875", fontWeight: 600 }}>{hovered.matches} {L.matchUnit}</span></>
            )}
          </div>
        </div>
      )}

      {/* Zoomed: pick-all button */}
      {zoomed && (
        <button onClick={() => onPickRegion(zoomed)} style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 3, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
          padding: "11px 20px", borderRadius: 999, background: "var(--green)", color: "#fff",
          fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)", border: "1px solid var(--green-deep)",
        }}>
          {L.pickAll(zoomed.jobs, zoomed.name)}
          <Icon name="arrow" size={14} color="#fff" stroke={2.2}/>
        </button>
      )}
    </div>
  );
};

const LegendRow = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 12, height: 12, borderRadius: 6, background: color, flexShrink: 0 }}/>
    <span style={{ fontSize: 11.5, color: "var(--ink-700)", fontWeight: 500 }}>{label}</span>
  </div>
);

window.SwedenJobMap = SwedenJobMap;
