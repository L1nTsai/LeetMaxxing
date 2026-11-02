// Browser notifications through the service worker in public/sw.js, so a
// click focuses (or opens) the app. Client-only.

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

export async function showBrowserNotification(title: string, body: string, url: string) {
  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  await reg.showNotification(title, { body, data: { url }, tag: "leetmaxxing-daily", icon: "/favicon.ico" });
}
