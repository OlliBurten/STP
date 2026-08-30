
// STP Screens — Jobb (Swipe+List), Utforska, Notiser, Profil

// ── Shared UI ────────────────────────────────────────────────
function Tag({ children, color, bg }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99,
      fontSize:11, fontWeight:600, background: bg || "rgba(31,95,92,0.1)", color: color || "#1F5F5C",
      whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function MatchBadge({ pct, theme }) {
  const color = pct >= 85 ? "#16a34a" : pct >= 65 ? "#ca8a04" : "#64748b";
  const bg = pct >= 85 ? "#dcfce7" : pct >= 65 ? "#fef9c3" : "#f1f5f9";
  const label = pct >= 85 ? "Stark match" : pct >= 65 ? "God match" : "Möjlig match";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px",
      borderRadius:99, fontSize:11, fontWeight:700, background: bg, color }}>
      <span style={{ fontSize:10 }}>●</span> {pct}% · {label}
    </span>
  );
}

// ── Swipe Card ───────────────────────────────────────────────
function SwipeCard({ job, onLike, onPass, isTop, stackIndex }) {
  const [drag, setDrag] = React.useState({ x: 0, y: 0, dragging: false, startX: 0, startY: 0 });
  const cardRef = React.useRef();

  const startDrag = (clientX, clientY) => setDrag(d => ({ ...d, dragging: true, startX: clientX, startY: clientY, x: 0, y: 0 }));
  const moveDrag = (clientX, clientY) => {
    if (!drag.dragging) return;
    setDrag(d => ({ ...d, x: clientX - d.startX, y: clientY - d.startY }));
  };
  const endDrag = () => {
    if (drag.x > 90) onLike();
    else if (drag.x < -90) onPass();
    setDrag({ x: 0, y: 0, dragging: false, startX: 0, startY: 0 });
  };

  const rotate = drag.x * 0.07;
  const opacity = isTop ? 1 : 1;
  const scale = isTop ? 1 : 1 - stackIndex * 0.04;
  const translateY = isTop ? 0 : stackIndex * 10;

  const cardStyle = {
    position: "absolute", inset: 0,
    borderRadius: 20,
    overflow: "hidden",
    background: "#fff",
    boxShadow: isTop ? "0 8px 40px rgba(0,0,0,0.18)" : "0 4px 16px rgba(0,0,0,0.10)",
    transform: isTop
      ? `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rotate}deg)`
      : `scale(${scale}) translateY(${translateY}px)`,
    transition: drag.dragging ? "none" : "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
    cursor: isTop ? "grab" : "default",
    userSelect: "none",
    zIndex: 10 - stackIndex,
    touchAction: "none",
  };

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      onMouseDown={isTop ? e => startDrag(e.clientX, e.clientY) : undefined}
      onMouseMove={isTop ? e => moveDrag(e.clientX, e.clientY) : undefined}
      onMouseUp={isTop ? endDrag : undefined}
      onMouseLeave={isTop ? endDrag : undefined}
      onTouchStart={isTop ? e => startDrag(e.touches[0].clientX, e.touches[0].clientY) : undefined}
      onTouchMove={isTop ? e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } : undefined}
      onTouchEnd={isTop ? endDrag : undefined}
    >
      {/* Background gradient header */}
      <div style={{ height: 200, background: `linear-gradient(135deg, ${job.color} 0%, ${job.color}cc 100%)`, position:"relative", display:"flex", alignItems:"flex-end", padding: "16px 20px" }}>
        {/* Company initials */}
        <div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", backdropFilter:"blur(4px)", flexShrink:0 }}>
          {job.company.slice(0,2).toUpperCase()}
        </div>
        <div style={{ marginLeft:12 }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{job.company}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{job.location}, {job.region}</div>
        </div>
        {/* Like / Pass overlay */}
        {drag.x > 30 && (
          <div style={{ position:"absolute", top:16, right:16, padding:"4px 12px", borderRadius:8, border:"3px solid #16a34a", color:"#16a34a", fontWeight:800, fontSize:20, background:"rgba(255,255,255,0.9)", letterSpacing:1, transform:"rotate(-10deg)" }}>GILLAR</div>
        )}
        {drag.x < -30 && (
          <div style={{ position:"absolute", top:16, left:16, padding:"4px 12px", borderRadius:8, border:"3px solid #ef4444", color:"#ef4444", fontWeight:800, fontSize:20, background:"rgba(255,255,255,0.9)", letterSpacing:1, transform:"rotate(10deg)" }}>PASSAR</div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ marginBottom:8 }}>
          <MatchBadge pct={job.match} />
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:"#0f172a", lineHeight:1.2, marginBottom:4 }}>{job.title}</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>{job.employment} · {job.salary} kr/mån</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
          <Tag>{job.license}</Tag>
          {job.verified && <Tag color="#16a34a" bg="#dcfce7">✓ Verifierat</Tag>}
          {job.kollektivavtal && <Tag color="#0369a1" bg="#e0f2fe">Kollektivavtal</Tag>}
          <Tag color="#64748b" bg="#f1f5f9">{job.segment === "FULLTIME" ? "Heltid" : "Flex"}</Tag>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#94a3b8" }}>
          <span>📍</span> {job.location}
          <span style={{ marginLeft:8 }}>💼</span> {job.employment}
        </div>
      </div>
    </div>
  );
}

// ── Swipe Screen ─────────────────────────────────────────────
function SwipeScreen({ jobs, onViewList, theme }) {
  const [deck, setDeck] = React.useState(jobs);
  const [lastAction, setLastAction] = React.useState(null);
  const [animating, setAnimating] = React.useState(false);

  const handleLike = () => {
    setLastAction("like");
    setDeck(d => d.slice(1));
    setTimeout(() => setLastAction(null), 600);
  };
  const handlePass = () => {
    setLastAction("pass");
    setDeck(d => d.slice(1));
    setTimeout(() => setLastAction(null), 600);
  };
  const handleSuperLike = () => {
    setLastAction("super");
    setDeck(d => d.slice(1));
    setTimeout(() => setLastAction(null), 600);
  };

  if (deck.length === 0) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Alla jobb genomgångna!</div>
      <div style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>Kom tillbaka imorgon för nya matcher.</div>
      <button onClick={() => setDeck(jobs)} style={{ padding:"12px 24px", borderRadius:12, background:"#1F5F5C", color:"#fff", fontWeight:700, border:"none", fontSize:15 }}>Börja om</button>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"12px 16px 0" }}>
      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#0f172a" }}>Dagens jobb</div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>{deck.length} jobb kvar</div>
        </div>
        <button onClick={onViewList} style={{ padding:"6px 14px", borderRadius:10, background:"#f1f5f9", border:"none", fontSize:13, fontWeight:600, color:"#475569", cursor:"pointer" }}>☰ Lista</button>
      </div>

      {/* Card stack */}
      <div style={{ flex:1, position:"relative", marginBottom:16 }}>
        {deck.slice(0,3).reverse().map((job, ri) => {
          const i = Math.min(deck.length - 1 - ri, 2);
          return (
            <SwipeCard
              key={job.id}
              job={job}
              isTop={ri === deck.slice(0,3).length - 1}
              stackIndex={i}
              onLike={handleLike}
              onPass={handlePass}
            />
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, paddingBottom:16 }}>
        <button onClick={handlePass} style={{ width:56, height:56, borderRadius:28, background:"#fff", border:"2px solid #fca5a5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 2px 12px rgba(0,0,0,0.08)", cursor:"pointer", transition:"transform 0.1s", transform: lastAction==="pass" ? "scale(1.3)" : "scale(1)" }}>✕</button>
        <button onClick={handleSuperLike} style={{ width:48, height:48, borderRadius:24, background:"#fff", border:"2px solid #93c5fd", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 2px 12px rgba(0,0,0,0.08)", cursor:"pointer", transform: lastAction==="super" ? "scale(1.3)" : "scale(1)", transition:"transform 0.1s" }}>⭐</button>
        <button onClick={handleLike} style={{ width:56, height:56, borderRadius:28, background:"#1F5F5C", border:"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 16px rgba(31,95,92,0.35)", cursor:"pointer", transform: lastAction==="like" ? "scale(1.3)" : "scale(1)", transition:"transform 0.1s" }}>✓</button>
      </div>
    </div>
  );
}

// ── Job List Screen ──────────────────────────────────────────
function JobListScreen({ jobs, onViewSwipe, theme }) {
  const [filter, setFilter] = React.useState("alla");
  const filters = ["alla","CE","C","Stockholm","Skåne","Heltid","Vikariat"];
  const filtered = filter === "alla" ? jobs : jobs.filter(j =>
    j.license === filter || j.region === filter || j.employment.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px 8px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#0f172a" }}>Lediga jobb</div>
          <button onClick={onViewSwipe} style={{ padding:"6px 14px", borderRadius:10, background:"#1F5F5C", border:"none", fontSize:13, fontWeight:600, color:"#fff", cursor:"pointer" }}>⊕ Swipe</button>
        </div>
        {/* Filter chips */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flexShrink:0, padding:"5px 12px", borderRadius:99, border: filter===f ? "none" : "1px solid #e2e8f0", background: filter===f ? "#1F5F5C" : "#fff", color: filter===f ? "#fff" : "#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 16px 16px" }}>
        {filtered.map(job => (
          <div key={job.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:2 }}>{job.title}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{job.company} · {job.location}</div>
              </div>
              <MatchBadge pct={job.match} />
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Tag>{job.license}</Tag>
              {job.kollektivavtal && <Tag color="#0369a1" bg="#e0f2fe">Kollektivavtal</Tag>}
              <Tag color="#64748b" bg="#f1f5f9">{job.employment}</Tag>
              <Tag color="#64748b" bg="#f1f5f9">{job.salary} kr/mån</Tag>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Explore Screen ───────────────────────────────────────────
function ExploreScreen({ companies, theme }) {
  const [q, setQ] = React.useState("");
  const filtered = companies.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.segment.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px 8px" }}>
        <div style={{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:10 }}>Hitta åkerier</div>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94a3b8" }}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sök åkeri eller bransch..." style={{ width:"100%", padding:"10px 12px 10px 36px", borderRadius:12, border:"1px solid #e2e8f0", fontSize:14, outline:"none", background:"#f8fafc", boxSizing:"border-box" }} />
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
        {filtered.map(c => (
          <div key={c.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"14px 16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#1F5F5C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", flexShrink:0 }}>{c.name.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>{c.name}</span>
                  {c.verified && <span style={{ fontSize:11, color:"#16a34a" }}>✓</span>}
                </div>
                <div style={{ fontSize:12, color:"#64748b" }}>{c.segment} · {c.region}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Tag color="#ca8a04" bg="#fef9c3">⭐ {c.rating} ({c.reviews})</Tag>
              <Tag color="#1F5F5C" bg="rgba(31,95,92,0.08)">{c.activeJobs} aktiva jobb</Tag>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications Screen ─────────────────────────────────────
function NotifsScreen({ notifs, theme }) {
  const [items, setItems] = React.useState(notifs);
  const markRead = id => setItems(ns => ns.map(n => n.id===id ? {...n, unread:false} : n));
  const unreadCount = items.filter(n => n.unread).length;
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#0f172a" }}>Notiser</div>
          {unreadCount > 0 && <span style={{ padding:"3px 9px", borderRadius:99, background:"#1F5F5C", color:"#fff", fontSize:11, fontWeight:700 }}>{unreadCount} nya</span>}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {items.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", borderBottom:"1px solid #f8fafc", cursor:"pointer", background: n.unread ? "#f0fdf4" : "#fff", transition:"background 0.2s" }}>
            <div style={{ width:40, height:40, borderRadius:20, background: n.unread ? "#dcfce7" : "#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{n.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontSize:14, fontWeight: n.unread ? 700 : 500, color:"#0f172a" }}>{n.title}</span>
                <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0, marginLeft:8 }}>{n.time}</span>
              </div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>
            </div>
            {n.unread && <div style={{ width:8, height:8, borderRadius:4, background:"#1F5F5C", flexShrink:0, marginTop:4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Availability Calendar ────────────────────────────────────
function AvailabilityCalendar() {
  const today = new Date(2026, 3, 22); // April 2026
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("sv-SE", { month:"long", year:"numeric" });
  const firstDay = new Date(year, month, 1).getDay(); // 0=sun
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Mon=0

  const [avail, setAvail] = React.useState(() => {
    const a = {};
    // Pre-fill some days
    [7,8,9,14,15,16,21,22,23,28,29].forEach(d => { a[d] = "available"; });
    [10,17,24].forEach(d => { a[d] = "busy"; });
    return a;
  });

  const toggle = (d) => {
    setAvail(a => {
      const cur = a[d];
      const next = !cur ? "available" : cur === "available" ? "busy" : null;
      const next2 = { ...a };
      if (next) next2[d] = next; else delete next2[d];
      return next2;
    });
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayLabels = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

  const availCount = Object.values(avail).filter(v=>v==="available").length;

  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>Tillgänglighet</div>
        <span style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>{availCount} dagar tillgänglig</span>
      </div>
      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:8, textTransform:"capitalize" }}>{monthName}</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:8 }}>
        {dayLabels.map(l => <div key={l} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:"#94a3b8", paddingBottom:4 }}>{l}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const state = avail[d];
          const isToday = d === today.getDate();
          const bg = state === "available" ? "#1F5F5C" : state === "busy" ? "#fecaca" : "#f1f5f9";
          const color = state === "available" ? "#fff" : state === "busy" ? "#dc2626" : "#94a3b8";
          return (
            <button key={d} onClick={() => toggle(d)} style={{ aspectRatio:"1", borderRadius:8, border: isToday ? "2px solid #F5A623" : "none", background: bg, color: color, fontSize:11, fontWeight: isToday ? 800 : 500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{d}</button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, fontSize:11, color:"#64748b" }}>
        <span><span style={{ display:"inline-block", width:10, height:10, borderRadius:3, background:"#1F5F5C", marginRight:4, verticalAlign:"middle" }} />Tillgänglig</span>
        <span><span style={{ display:"inline-block", width:10, height:10, borderRadius:3, background:"#fecaca", marginRight:4, verticalAlign:"middle" }} />Upptagen</span>
        <span><span style={{ display:"inline-block", width:10, height:10, borderRadius:3, background:"#f1f5f9", border:"1px solid #e2e8f0", marginRight:4, verticalAlign:"middle" }} />Ej satt</span>
      </div>
    </div>
  );
}

// ── Profile Screen ───────────────────────────────────────────
function ProfileScreen({ theme }) {
  const [visible, setVisible] = React.useState(true);
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 24px" }}>
      {/* Profile header */}
      <div style={{ background:"linear-gradient(135deg, #1F5F5C 0%, #2D4A3E 100%)", borderRadius:20, padding:"20px 20px 16px", marginBottom:14, color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <div style={{ width:56, height:56, borderRadius:28, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, backdropFilter:"blur(4px)", flexShrink:0 }}>OH</div>
          <div>
            <div style={{ fontSize:18, fontWeight:800 }}>Oskar Hansson</div>
            <div style={{ fontSize:13, opacity:0.8 }}>CE-chaufför · Malmö</div>
          </div>
        </div>
        {/* Profile score */}
        <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:600 }}>Profilstyrka</span>
            <span style={{ fontSize:12, fontWeight:800 }}>78 / 100</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.2)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:"78%", borderRadius:3, background:"#F5A623" }} />
          </div>
        </div>
        {/* Visibility toggle */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13 }}>Synlig för åkerier</span>
          <div onClick={() => setVisible(v=>!v)} style={{ width:44, height:24, borderRadius:12, background: visible ? "#F5A623" : "rgba(255,255,255,0.3)", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
            <div style={{ position:"absolute", top:3, left: visible ? 23 : 3, width:18, height:18, borderRadius:9, background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </div>

      {/* Licenses */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"14px 16px", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Behörigheter & certifikat</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          <Tag>CE</Tag>
          <Tag>C</Tag>
          <Tag color="#7c3aed" bg="#ede9fe">YKB</Tag>
          <Tag color="#0369a1" bg="#e0f2fe">ADR Grund</Tag>
          <Tag color="#64748b" bg="#f1f5f9">8 års erfarenhet</Tag>
          <Tag color="#64748b" bg="#f1f5f9">Fjärrtrafik</Tag>
        </div>
      </div>

      {/* Availability calendar */}
      <AvailabilityCalendar />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
        {[["12", "Matcher"], ["3", "Kontakter"], ["47", "Profilvisningar"]].map(([val, lbl]) => (
          <div key={lbl} style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:"#1F5F5C" }}>{val}</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Settings shortcuts */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        {["Redigera profil", "Mina ansökningar", "Sparade jobb", "Inställningar", "Logga ut"].map((item, i) => (
          <div key={item} style={{ padding:"14px 16px", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", color: item === "Logga ut" ? "#dc2626" : "#0f172a", fontSize:14, fontWeight: item === "Logga ut" ? 600 : 500 }}>
            {item} {item !== "Logga ut" && <span style={{ color:"#cbd5e1" }}>›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SwipeScreen, JobListScreen, ExploreScreen, NotifsScreen, ProfileScreen });
