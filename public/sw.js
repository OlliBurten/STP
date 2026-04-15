self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: event.data?.text() ?? "Ny notis" };
  }

  const title = data.title || "Transportplattformen";
  const options = {
    body: data.body || "",
    icon: "/stp-icon-192.png",
    badge: "/stp-icon-192.png",
    data: { link: data.link || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        // Focus existing tab if open
        for (const win of wins) {
          if (new URL(win.url).origin === self.location.origin) {
            win.focus();
            win.postMessage({ type: "PUSH_NAVIGATE", link });
            return;
          }
        }
        return clients.openWindow(link);
      })
  );
});
