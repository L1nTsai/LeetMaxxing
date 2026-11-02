"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { localDay } from "@/lib/day";
import { TOUR_END_EVENT, TOUR_START_EVENT, TOUR_STORAGE_KEY } from "@/components/Tour";
import { Button } from "@/components/ui";
import { notificationsSupported, showBrowserNotification } from "@/lib/browser-notify";
import { sendTestMacNotification, setMacJobInstalled } from "@/app/(app)/reminders/actions";
import type { ReminderResult } from "@/app/(app)/reminders/actions";

// Setup cards for the two reminder channels. Used in Settings (always shown)
// and at the bottom of the dashboard (only while something isn't set up).

type Variant = "card" | "row";
const wrapper: Record<Variant, string> = {
  card: "rounded-lg border border-border p-4 space-y-3",
  row: "py-3 space-y-2",
};
const small = "h-8 px-3 text-xs";

// Notification permission as an external store: changes after our own prompt
// or when the user flips it in the browser's site settings.
const permissionListeners = new Set<() => void>();

export function readPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export function subscribePermission(onChange: () => void) {
  permissionListeners.add(onChange);
  let status: PermissionStatus | undefined;
  navigator.permissions?.query({ name: "notifications" }).then((s) => {
    status = s;
    s.addEventListener("change", onChange);
  }).catch(() => {});
  return () => {
    permissionListeners.delete(onChange);
    status?.removeEventListener("change", onChange);
  };
}

export function BrowserCard({ variant = "card" }: { variant?: Variant }) {
  const permission = useNotificationPermission();
  const [note, setNote] = useState<string | null>(null);

  async function enable() {
    await Notification.requestPermission();
    permissionListeners.forEach((fn) => fn());
  }

  async function test() {
    try {
      await showBrowserNotification("LeetMaxxing", "Test notification — browser reminders are working.", "/settings");
      setNote("Sent. Not seeing it? Check System Settings → Notifications for your browser.");
    } catch {
      setNote("Couldn't show the notification.");
    }
  }

  return (
    <div className={wrapper[variant]}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Browser</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            {permission === "granted" && "Allowed."}
            {permission === "default" && "Not allowed yet."}
            {permission === "denied" && "Blocked. Allow notifications for this site in your browser's settings."}
            {permission === "unsupported" && "This browser doesn't support notifications."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {permission === "default" && <Button onClick={enable} className={small}>Allow</Button>}
          {permission === "granted" && <Button variant="secondary" onClick={test} className={small}>Send test</Button>}
        </div>
      </div>
      {note && <p className="text-xs text-foreground-tertiary">{note}</p>}
    </div>
  );
}

export function MacCard({ installed, variant = "card" }: { installed: boolean; variant?: Variant }) {
  const [result, setResult] = useState<ReminderResult | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<ReminderResult>) => startTransition(async () => setResult(await fn()));

  return (
    <div className={wrapper[variant]}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">macOS background check</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            {installed
              ? "Installed. Checks every 5 minutes, even when the app and dev server are closed."
              : "Not installed. Needed for reminders while the app is closed."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" disabled={pending} onClick={() => act(sendTestMacNotification)} className={small}>
            Send test
          </Button>
          <Button
            variant={installed ? "secondary" : "primary"}
            disabled={pending}
            onClick={() => act(() => setMacJobInstalled(!installed))}
            className={small}
          >
            {installed ? "Remove" : "Install"}
          </Button>
        </div>
      </div>
      {result && !result.success && <p className="text-xs text-danger">{result.error}</p>}
      {result?.success && result.message && <p className="text-xs text-foreground-tertiary">{result.message}</p>}
    </div>
  );
}

/** Browser notification permission; null while rendering on the server. */
export function useNotificationPermission() {
  return useSyncExternalStore(subscribePermission, readPermission, () => null);
}

// --- Dashboard popup -------------------------------------------------------

const SNOOZE_KEY = "leetmaxxing:reminder-setup-snoozed"; // value: YYYY-MM-DD
const SNOOZE_EVENT = "leetmaxxing:reminder-setup-snoozed";

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

// Tour state, so the popup never sits on top of the getting-started tour.
let tourRunning = false;
function subscribeTour(onChange: () => void) {
  const start = () => { tourRunning = true; onChange(); };
  const end = () => { tourRunning = false; onChange(); };
  window.addEventListener(TOUR_START_EVENT, start);
  window.addEventListener(TOUR_END_EVENT, end);
  return () => {
    window.removeEventListener(TOUR_START_EVENT, start);
    window.removeEventListener(TOUR_END_EVENT, end);
  };
}
const readTourDone = () => !tourRunning && storageGet(TOUR_STORAGE_KEY) === "1";

function subscribeSnooze(onChange: () => void) {
  window.addEventListener(SNOOZE_EVENT, onChange);
  return () => window.removeEventListener(SNOOZE_EVENT, onChange);
}
const readSnoozed = () => storageGet(SNOOZE_KEY) === localDay();

/**
 * Floating card, bottom-right, for channels that are switched on in Settings
 * but not set up yet. "Not today" hides it until tomorrow; it goes away for
 * good once both channels are done.
 */
export function NotificationSetup({ browserWanted, macWanted, macInstalled }: {
  browserWanted: boolean;
  macWanted: boolean;
  macInstalled: boolean;
}) {
  const permission = useNotificationPermission();
  const tourDone = useSyncExternalStore(subscribeTour, readTourDone, () => false);
  const snoozed = useSyncExternalStore(subscribeSnooze, readSnoozed, () => true);

  const showBrowser = browserWanted && permission === "default";
  const showMac = macWanted && !macInstalled;
  if ((!showBrowser && !showMac) || !tourDone || snoozed) return null;

  function snooze() {
    try { localStorage.setItem(SNOOZE_KEY, localDay()); } catch { /* shows again on next load */ }
    window.dispatchEvent(new Event(SNOOZE_EVENT));
  }

  return (
    <aside
      aria-labelledby="reminder-setup-title"
      className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-2rem))] rounded-lg border border-border-strong bg-background px-4 pt-4 pb-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="reminder-setup-title" className="text-sm font-medium">Set up reminders</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Get nudged when today&apos;s goal isn&apos;t done yet. Times are in{" "}
            <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">Settings</Link>.
          </p>
        </div>
        <button
          type="button"
          onClick={snooze}
          aria-label="Hide until tomorrow"
          className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-md text-foreground-tertiary hover:bg-muted hover:text-foreground transition-colors"
        >
          ×
        </button>
      </div>
      <div className="mt-1 divide-y divide-border">
        {showBrowser && <BrowserCard variant="row" />}
        {showMac && <MacCard installed={false} variant="row" />}
        <div className="py-2">
          <button type="button" onClick={snooze} className="text-xs text-foreground-tertiary hover:text-foreground transition-colors">
            Not today
          </button>
        </div>
      </div>
    </aside>
  );
}
