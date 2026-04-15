const API = import.meta.env.VITE_API_URL || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getVapidPublicKey(token) {
  const res = await fetch(`${API}/api/notifications/vapid-public-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.publicKey;
}

export async function subscribeToPush(token) {
  const registration = await navigator.serviceWorker.ready;
  const publicKey = await getVapidPublicKey(token);
  if (!publicKey) return null;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await fetch(`${API}/api/notifications/push-subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  return subscription;
}

export async function unsubscribeFromPush(token) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await fetch(`${API}/api/notifications/push-unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint }),
  });
}

export async function getPushPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function getCurrentSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}
