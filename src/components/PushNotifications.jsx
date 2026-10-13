/**
 * Pushnotiser i webbläsaren — "få en notis direkt när någon söker".
 * Infrastrukturen (VAPID, service worker, /push-subscribe) fanns men inget i appen lät
 * någon slå på det, så ingen fick notiser direkt. Varje notis i appen skickas som push.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCurrentSubscription, getPushPermission, registerServiceWorker, subscribeToPush, unsubscribeFromPush } from "../utils/pushNotifications";

const DISMISS_KEY = "stp_push_banner_dismissed";
const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIos = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

export function usePush() {
  const { token } = useAuth();
  const [state, setState] = useState({ ready: false, supported: false, permission: "default", subscribed: false, busy: false });

  const refresh = useCallback(async () => {
    if (!supported()) { setState((s) => ({ ...s, ready: true, supported: false })); return; }
    const [permission, sub] = await Promise.all([getPushPermission(), getCurrentSubscription().catch(() => null)]);
    setState((s) => ({ ...s, ready: true, supported: true, permission, subscribed: Boolean(sub) && permission === "granted" }));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const enable = useCallback(async () => {
    if (!token) return false;
    setState((s) => ({ ...s, busy: true }));
    try {
      await registerServiceWorker();
      const sub = await subscribeToPush(token);
      await refresh();
      return Boolean(sub);
    } catch {
      await refresh();
      return false;
    } finally {
      setState((s) => ({ ...s, busy: false }));
    }
  }, [token, refresh]);

  const disable = useCallback(async () => {
    if (!token) return;
    setState((s) => ({ ...s, busy: true }));
    try { await unsubscribeFromPush(token); } catch { /* ignore */ }
    await refresh();
    setState((s) => ({ ...s, busy: false }));
  }, [token, refresh]);

  return { ...state, enable, disable };
}

/** Banner på åkeriets översikt tills notiser är påslagna eller bannern stängts. */
export function PushBanner({ text = "Få en notis direkt när någon söker" }) {
  const push = usePush();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  if (!push.ready || !push.supported || push.subscribed || push.permission === "denied" || dismissed) return null;
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 18, borderRadius: 12, background: "var(--green-tint)", border: "1px solid var(--line)" }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>🔔</span>
      <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{text}</span>
      <button type="button" onClick={push.enable} disabled={push.busy} style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}>
        {push.busy ? "Slår på…" : "Slå på"}
      </button>
      <button type="button" onClick={dismiss} aria-label="Stäng" style={{ background: "none", border: "none", color: "var(--ink-400)", fontSize: 18, cursor: "pointer", padding: 4 }}>×</button>
    </div>
  );
}

/** Statusrad + knapp för Inställningar → Notiser. */
export function PushSetting() {
  const push = usePush();
  if (!push.ready) return null;
  let status;
  let action = null;
  if (!push.supported) {
    status = isIos() ? "Lägg till STP på hemskärmen (Dela → Lägg till på hemskärmen) för att få notiser på iPhone." : "Webbläsaren stöder inte notiser.";
  } else if (push.permission === "denied") {
    status = "Notiser är blockerade för transportplattformen.se i webbläsaren. Tillåt dem i webbläsarens inställningar.";
  } else if (push.subscribed) {
    status = "På för den här enheten.";
    action = <button type="button" onClick={push.disable} disabled={push.busy} style={btn(false)}>Stäng av</button>;
  } else {
    status = "Av för den här enheten.";
    action = <button type="button" onClick={push.enable} disabled={push.busy} style={btn(true)}>{push.busy ? "Slår på…" : "Slå på"}</button>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>Notiser direkt på den här enheten</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{status}</div>
      </div>
      {action}
    </div>
  );
}

const btn = (primary) => ({
  padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit",
  border: primary ? "none" : "1px solid var(--line-2)", background: primary ? "var(--green)" : "var(--card)", color: primary ? "#fff" : "var(--ink-700)",
});
