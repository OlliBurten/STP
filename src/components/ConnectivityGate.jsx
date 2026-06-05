/* Connectivity + maintenance gate.
 *
 * - Maintenance: set VITE_MAINTENANCE=1 at build time to take the whole app
 *   down behind the "Vi underhåller plattformen" page.
 * - Offline: when the browser goes offline we overlay the offline page on top
 *   of the live app (children stay mounted, so state is preserved on reconnect).
 */
import { useEffect, useState } from "react";
import ErrorPage from "./ErrorPage";

const MAINTENANCE =
  import.meta.env.VITE_MAINTENANCE === "1" ||
  import.meta.env.VITE_MAINTENANCE === "true";

export default function ConnectivityGate({ children }) {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (MAINTENANCE) return <ErrorPage variant="maintenance" />;

  return (
    <>
      {children}
      {!online && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
          <ErrorPage
            variant="offline"
            onRetry={() => setOnline(navigator.onLine)}
          />
        </div>
      )}
    </>
  );
}
