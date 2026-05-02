import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("Verifierar din e-post...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verifieringstoken saknas.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Din e-post är nu verifierad.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message || "Verifieringen misslyckades.");
      });
  }, [token]);

  const statusStyle = status === "success"
    ? { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }
    : status === "error"
      ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }
      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.7)" };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ ...statusStyle, borderRadius: 16, padding: "24px 28px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>E-postverifiering</h1>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.85 }}>{message}</p>
        </div>
        <Link to="/login" style={{ display: "inline-block", marginTop: 24, fontSize: 14, color: "#4ade80", textDecoration: "none" }}>
          Till login
        </Link>
      </div>
    </main>
  );
}
