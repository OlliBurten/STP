import { useState, useEffect, useRef, useMemo } from "react";
import { SWE_LAN_PATHS, SWE_LAN_BOX, SWE_VIEW } from "../data/swedenGeo";
import { getCityXY } from "../data/swedenCityCoords";

/* ════════════════════════════════════════════════════════════
   SwedenJobMap — två nivåer, som iPhone Photos-kartan:
     • Översikt (utzoomat): en bubbla per län, placerad på det
       VIKTADE jobb-centret (snitt av orternas riktiga koordinater),
       inte länsboxens mitt → hamnar aldrig i havet.
     • Klick på län → mjuk inzoomning till länets bounding-box, och
       bubblan separeras i enskilda ort-prickar på sina EXAKTA
       projicerade lägen (cityToSVG), storlek efter antal jobb.

   Allt ritas utifrån en animerad `view` (viewBox-tween) så att
   kartans zoom och prickarnas skärmstorlek hålls i synk. Storlekar
   anges i "full-vy-enheter" och multipliceras med k = view.w/FULL.w
   så att de ser konstanta ut på skärmen oavsett zoomnivå.
════════════════════════════════════════════════════════════ */

const FULL = SWE_VIEW;
const PATHS = SWE_LAN_PATHS || {};
const BOX = SWE_LAN_BOX || {};
const ALL_CODES = Object.keys(PATHS);

// Residensstad/största stad per län — fallback om inga orter med jobb finns
const CAPITAL = {
  AB: "Stockholm", C: "Uppsala", D: "Nyköping", E: "Linköping", F: "Jönköping",
  G: "Växjö", H: "Kalmar", I: "Visby", K: "Karlskrona", M: "Malmö", N: "Halmstad",
  O: "Göteborg", S: "Karlstad", T: "Örebro", U: "Västerås", W: "Falun",
  X: "Gävle", Y: "Härnösand", Z: "Östersund", AC: "Umeå", BD: "Luleå",
};

const projectCity = (name) => getCityXY(name);

// Viktat center av ett läns orter (med jobb), fallback till residensstad/box-mitt
const regionCenter = (r) => {
  const pts = (r.cities || []).map((c) => ({ p: projectCity(c.name), w: c.jobs || 1 })).filter((o) => o.p);
  if (pts.length) {
    let sx = 0, sy = 0, sw = 0;
    pts.forEach(({ p, w }) => { sx += p.x * w; sy += p.y * w; sw += w; });
    return { x: sx / sw, y: sy / sw };
  }
  const cap = CAPITAL[r.code];
  const pc = cap && projectCity(cap);
  if (pc) return pc;
  const b = BOX[r.code];
  return b ? { x: b.cx, y: b.cy } : { x: 145, y: 330 };
};

// Padda en läns-box så det blir luft runt vid inzoomning
const paddedBox = (b) => {
  const pad = 0.22;
  return { x: b.x - b.w * pad, y: b.y - b.h * pad, w: b.w * (1 + 2 * pad), h: b.h * (1 + 2 * pad) };
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const SwedenJobMap = ({ regions = [], onPickRegion = () => {}, height = 580 }) => {
  const [zoomCode, setZoomCode] = useState(null);
  const [hover, setHover] = useState(null); // { kind:'region'|'city', code, name, jobs, x, y }

  const byCode = useMemo(() => {
    const m = {};
    regions.forEach((r) => { m[r.code] = r; });
    return m;
  }, [regions]);

  const maxJobs = useMemo(() => Math.max(1, ...regions.map((r) => r.jobs || 0)), [regions]);
  const centers = useMemo(() => {
    const m = {};
    regions.forEach((r) => { m[r.code] = regionCenter(r); });
    return m;
  }, [regions]);

  // ── viewBox-tween ─────────────────────────────────────────
  const target = zoomCode && BOX[zoomCode] ? paddedBox(BOX[zoomCode]) : FULL;
  const [view, setView] = useState(FULL);
  const viewRef = useRef(FULL);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = viewRef.current;
    const to = target;
    const start = performance.now();
    const dur = 560;
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const e = easeInOutCubic(p);
      const v = {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
        h: from.h + (to.h - from.h) * e,
      };
      viewRef.current = v;
      setView(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.w, target.h]);

  // k = skalfaktor; multiplicera alla "full-vy-storlekar" med detta så de ser konstanta ut
  const k = Math.max(view.w / FULL.w, view.h / FULL.h);

  const zoomedRegion = zoomCode ? byCode[zoomCode] : null;
  const zoomCities = useMemo(() => {
    if (!zoomedRegion) return [];
    const pts = (zoomedRegion.cities || [])
      .map((c) => ({ name: c.name, jobs: c.jobs || 0, p: projectCity(c.name) }))
      .filter((c) => c.p)
      .sort((a, b) => b.jobs - a.jobs);
    // Klustra orter som ligger närmare än ~6% av regionens vy-bredd (annars överlappar storstäder)
    const box = zoomCode && BOX[zoomCode] ? paddedBox(BOX[zoomCode]) : FULL;
    const thr = box.w * 0.06;
    const used = new Array(pts.length).fill(false);
    const clusters = [];
    for (let i = 0; i < pts.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      let jobs = pts[i].jobs, count = 1;
      for (let j = i + 1; j < pts.length; j++) {
        if (used[j]) continue;
        if (Math.hypot(pts[j].p.x - pts[i].p.x, pts[j].p.y - pts[i].p.y) < thr) { used[j] = true; jobs += pts[j].jobs; count++; }
      }
      clusters.push({ name: pts[i].name, jobs, count, p: pts[i].p });
    }
    return clusters;
  }, [zoomedRegion, zoomCode]);
  const maxCityJobs = useMemo(() => Math.max(1, ...zoomCities.map((c) => c.jobs || 0)), [zoomCities]);

  const regionR = (jobs) => (16 + (jobs / maxJobs) * 22) * k;
  const cityR = (jobs) => (9 + (jobs / maxCityJobs) * 15) * k;

  // skärmposition (%) för ett SVG-koordinatpar, för HTML-overlays
  const toPct = (x, y) => ({
    left: `${((x - view.x) / view.w) * 100}%`,
    top: `${((y - view.y) / view.h) * 100}%`,
  });

  const overviewOpacity = zoomCode ? 0 : 1;
  const cityOpacity = zoomCode ? 1 : 0;

  return (
    <div style={{
      position: "relative", width: "100%", height,
      background: "var(--card)", border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--sh-sm)", overflow: "hidden",
    }}>
      {/* Punkt-rutnät bakgrund */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
        backgroundSize: "22px 22px", opacity: 0.5, pointerEvents: "none",
      }} />

      {/* Legend / titel */}
      <div style={{
        position: "absolute", top: 16, left: 18, zIndex: 3,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", maxWidth: 180,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 4 }}>
          {zoomedRegion ? zoomedRegion.name : "Lediga jobb"}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-400)", lineHeight: 1.4 }}>
          {zoomedRegion
            ? `${zoomedRegion.jobs} jobb · klicka på en ort`
            : "Klicka på ett län för att zooma in och se orterna."}
        </div>
      </div>

      {/* Tillbaka-knapp + visa-alla (vid inzoomning) */}
      {zoomedRegion && (
        <div style={{ position: "absolute", top: 16, right: 18, zIndex: 4, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <button
            onClick={() => setZoomCode(null)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
              border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "var(--font)", boxShadow: "var(--sh-sm)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Hela Sverige
          </button>
          <button
            onClick={() => onPickRegion({ ...zoomedRegion })}
            style={{
              padding: "8px 13px", borderRadius: 9, background: "var(--green)", color: "#fff",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)",
              border: "none", boxShadow: "var(--sh-sm)",
            }}
          >
            Visa {zoomedRegion.jobs} jobb i listan
          </button>
        </div>
      )}

      {/* SVG-karta */}
      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Län-fyllningar */}
        {ALL_CODES.map((code) => {
          const active = !!byCode[code];
          const isFocus = zoomCode === code;
          const isHover = hover?.code === code;
          const fill = isFocus
            ? "var(--green-tint)"
            : active
              ? (isHover ? "var(--green-tint-2, #d4ede1)" : "var(--green-tint)")
              : "var(--paper-2)";
          return (
            <path
              key={code}
              d={PATHS[code]}
              fill={fill}
              stroke={(active && isHover) || isFocus ? "var(--green)" : "var(--line-2)"}
              strokeWidth={(active && isHover) || isFocus ? "1.4" : "0.6"}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              style={{ cursor: active ? "pointer" : "default", transition: "fill .15s, stroke .15s" }}
              onMouseEnter={() => active && !zoomCode && setHover({ kind: "region", code })}
              onMouseLeave={() => setHover(null)}
              onClick={() => { if (active) { setHover(null); setZoomCode(code); } }}
            />
          );
        })}

        {/* Översikt: läns-bubblor på viktat jobb-center */}
        <g style={{ opacity: overviewOpacity, transition: "opacity .3s", pointerEvents: zoomCode ? "none" : "auto" }}>
          {regions.map((r) => {
            const c = centers[r.code];
            if (!c) return null;
            const rad = regionR(r.jobs);
            const isHover = hover?.kind === "region" && hover.code === r.code;
            return (
              <g
                key={r.code}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ kind: "region", code: r.code })}
                onMouseLeave={() => setHover(null)}
                onClick={() => { setHover(null); setZoomCode(r.code); }}
              >
                {r.matches > 0 && (
                  <circle cx={c.x} cy={c.y} r={rad + 4 * k} fill="none" stroke="var(--amber)" strokeWidth="2" opacity="0.5" vectorEffect="non-scaling-stroke">
                    <animate attributeName="r" values={`${rad + k};${rad + 7 * k};${rad + k}`} dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={c.x} cy={c.y} r={rad}
                  fill="var(--green)"
                  fillOpacity={isHover ? 0.98 : 0.45 + (r.jobs / maxJobs) * 0.5}
                  stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                  style={{ transition: "fill-opacity .15s" }}
                />
                <text
                  x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontWeight="800" fontSize={rad * 0.8}
                  fontFamily="var(--mono)" style={{ pointerEvents: "none" }}
                >{r.jobs}</text>
              </g>
            );
          })}
        </g>

        {/* Inzoomat: ort-prickar på exakta projicerade lägen */}
        <g style={{ opacity: cityOpacity, transition: "opacity .3s", pointerEvents: zoomCode ? "auto" : "none" }}>
          {zoomCities.map((c) => {
            const rad = cityR(c.jobs);
            const isHover = hover?.kind === "city" && hover.name === c.name;
            return (
              <g
                key={c.name}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ kind: "city", name: c.name, jobs: c.jobs, x: c.p.x, y: c.p.y })}
                onMouseLeave={() => setHover(null)}
                onClick={() => onPickRegion({ ...zoomedRegion, location: c.count > 1 ? undefined : c.name })}
              >
                <circle
                  cx={c.p.x} cy={c.p.y} r={rad}
                  fill="var(--green)" fillOpacity={isHover ? 1 : 0.9}
                  stroke="#fff" strokeWidth="1.3" vectorEffect="non-scaling-stroke"
                />
                <text
                  x={c.p.x} y={c.p.y} textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontWeight="800" fontSize={rad * 0.8} fontFamily="var(--mono)"
                  style={{ pointerEvents: "none" }}
                >{c.jobs}</text>
                <text
                  x={c.p.x} y={c.p.y + rad + 14 * k} textAnchor="middle"
                  fill="var(--ink-700)" fontWeight="700" fontSize={15 * k}
                  fontFamily="var(--font)" style={{ pointerEvents: "none" }}
                >{c.count > 1 ? `${c.name} +${c.count - 1}` : c.name}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover-tooltip (översikt) */}
      {hover?.kind === "region" && centers[hover.code] && byCode[hover.code] && (
        <div style={{
          position: "absolute", ...toPct(centers[hover.code].x, centers[hover.code].y),
          transform: "translate(-50%, calc(-100% - 16px))", zIndex: 5, pointerEvents: "none",
          background: "var(--ink-900)", color: "#fff", borderRadius: 10, padding: "9px 13px",
          boxShadow: "var(--sh-md)", whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>{byCode[hover.code].name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{byCode[hover.code].jobs}</span> lediga jobb · klicka för att zooma
          </div>
        </div>
      )}
    </div>
  );
};

export default SwedenJobMap;
