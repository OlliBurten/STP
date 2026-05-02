import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { EyeIcon, EyeOffIcon } from "../components/Icons";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Återställningstoken saknas.");
      return;
    }
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess("Lösenordet är uppdaterat. Du kan nu logga in.");
      setPassword("");
      setConfirm("");
    } catch (e2) {
      setError(e2.message || "Kunde inte återställa lösenord.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "13px 48px 13px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f0faf9", fontSize: 15, outline: "none", boxSizing: "border-box" };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "40px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>Återställ lösenord</h1>
        <p style={{ fontSize: 15, color: "rgba(240,250,249,0.5)", margin: "0 0 24px" }}>Ange nytt lösenord (minst 8 tecken).</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <p style={{ fontSize: 14, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>}
          {success && <p style={{ fontSize: 14, color: "#4ade80", padding: "10px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10 }}>{success}</p>}
          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.65)", marginBottom: 8 }}>
              Nytt lösenord
            </label>
            <div style={{ position: "relative" }}>
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }} aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                {showPassword ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.65)", marginBottom: 8 }}>
              Bekräfta lösenord
            </label>
            <div style={{ position: "relative" }}>
              <input id="confirm" type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }} aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                {showPassword ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Sparar..." : "Spara nytt lösenord"}
          </button>
        </form>
        <Link to="/login" style={{ display: "inline-block", marginTop: 20, fontSize: 14, color: "#4ade80", textDecoration: "none" }}>
          Till login
        </Link>
      </div>
    </main>
  );
}
