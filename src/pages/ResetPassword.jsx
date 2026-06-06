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

  const inputStyle = { width: "100%", padding: "13px 48px 13px 16px", borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--paper-2)", color: "var(--ink-900)", fontSize: "var(--text-md)", outline: "none", boxSizing: "border-box" };

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 24, padding: "40px 36px", boxShadow: "var(--sh)" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink-900)", letterSpacing: "-0.5px", margin: "0 0 10px" }}>Återställ lösenord</h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", margin: "0 0 24px" }}>Ange nytt lösenord (minst 8 tecken).</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <p style={{ fontSize: "var(--text-base)", color: "var(--danger)", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>}
          {success && <p style={{ fontSize: "var(--text-base)", color: "var(--success)", padding: "10px 14px", background: "var(--success-tint)", border: "1px solid var(--success)", borderRadius: 10 }}>{success}</p>}
          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 8 }}>
              Nytt lösenord
            </label>
            <div style={{ position: "relative" }}>
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex" }} aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                {showPassword ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 8 }}>
              Bekräfta lösenord
            </label>
            <div style={{ position: "relative" }}>
              <input id="confirm" type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex" }} aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                {showPassword ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 14, background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, border: "none", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Sparar..." : "Spara nytt lösenord"}
          </button>
        </form>
        <Link to="/login" style={{ display: "inline-block", marginTop: 20, fontSize: "var(--text-base)", color: "var(--green-text)", textDecoration: "none" }}>
          Till login
        </Link>
      </div>
    </main>
  );
}
