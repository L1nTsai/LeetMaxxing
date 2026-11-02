"use client";

import { useEffect } from "react";
import { reminderTick } from "@/app/(app)/reminders/actions";
import { notificationsSupported, registerServiceWorker, showBrowserNotification } from "@/lib/browser-notify";

const TICK_MS = 60_000;

/** Checks in with the server about once a minute and shows the daily reminder when it's due. */
export default function ReminderWatcher() {
  useEffect(() => {
    if (!notificationsSupported()) return;
    registerServiceWorker().catch(() => {});

    let busy = false;
    async function tick() {
      if (busy) return;
      busy = true;
      try {
        const msg = await reminderTick(Notification.permission === "granted");
        if (msg) await showBrowserNotification(msg.title, msg.body, msg.url);
      } catch {
        // Dev server restarting or offline; try again next tick.
      } finally {
        busy = false;
      }
    }

    tick();
    const id = setInterval(tick, TICK_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
