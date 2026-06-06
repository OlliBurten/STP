import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../api/client.js";
import PageMeta from "../components/PageMeta";

export default function OptOut() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ok | already | error

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    apiGet(`/api/applications/opt-out/${token}`)
      .then((data) => setStatus(data?.alreadyOptedOut ? "already" : "ok"))
      .catch(() => setStatus("error"));
  }, [token]);

  const body = {
    loading: {
      title: "Avregistrerar...",
      text: "",
    },
    ok: {
      title: "Avregistrerat",
      text: "Ni kommer inte längre ta emot e-post från Sveriges Transportplattform angående kandidater för era annonser. Ni kan alltid ändra er och ansluta via transportplattformen.se.",
    },
    already: {
      title: "Redan avregistrerat",
      text: "Er organisation har redan avregistrerat sig från dessa utskick.",
    },
    error: {
      title: "Ogiltig länk",
      text: "Länken är ogiltig eller har redan använts. Kontakta oss om ni behöver hjälp.",
    },
  }[status];

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <PageMeta title="Avregistrering – STP" noindex />
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xs)" }}>S</div>
          <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--ink-900)", letterSpacing: 0.2 }}>STP</span>
        </Link>

        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "36px 32px", boxShadow: "var(--sh-sm)" }}>
          {status === "loading" ? (
            <div style={{ fontSize: "var(--text-md)", color: "var(--ink-400)" }}>Avregistrerar...</div>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>{body.title}</h1>
              <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.65 }}>{body.text}</p>
              <Link
                to="/"
                style={{ display: "inline-block", marginTop: 24, padding: "12px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-base)", textDecoration: "none" }}
              >
                Till startsidan
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
