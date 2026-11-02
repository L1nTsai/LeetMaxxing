"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { db, DB_PATH } from "@/lib/db";
import { claimDueReminder, markBrowserPresent, MAX_REMINDER_TIMES } from "@/lib/reminders";
import type { ReminderMessage } from "@/lib/reminders";
import { installReminderJob, notifyMac, uninstallReminderJob } from "@/lib/mac";

/**
 * Called about once a minute by every open tab. A tab that can show
 * notifications checks in (so the macOS job stays quiet) and claims the daily
 * reminder when it's due.
 */
export async function reminderTick(canNotify: boolean): Promise<ReminderMessage | null> {
  if (!canNotify) return null;
  const conn = db();
  const notifyBrowser = (conn.prepare("select notify_browser from settings where id = 1")
    .get() as { notify_browser: number }).notify_browser === 1;
  if (!notifyBrowser) return null;
  markBrowserPresent(conn);
  return claimDueReminder(conn, "browser");
}

export type ReminderResult = { success: true; message?: string } | { success: false; error: string };

export async function saveReminderSettings(
  _prev: ReminderResult | null,
  formData: FormData,
): Promise<ReminderResult> {
  const raw = formData.getAll("reminder_time").map(String).filter(Boolean);
  if (raw.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return { success: false, error: "Pick a valid time." };
  const times = [...new Set(raw)].sort();
  if (times.length === 0) return { success: false, error: "Add at least one time." };
  if (times.length > MAX_REMINDER_TIMES) return { success: false, error: `At most ${MAX_REMINDER_TIMES} times a day.` };
  const flag = (name: string) => (formData.get(name) === "on" ? 1 : 0);

  const conn = db();
  conn.transaction(() => {
    conn.prepare("update settings set reminders_enabled = ?, notify_browser = ?, notify_mac = ? where id = 1")
      .run(flag("reminders_enabled"), flag("notify_browser"), flag("notify_mac"));
    conn.prepare("delete from reminder_times").run();
    const insert = conn.prepare("insert into reminder_times (time) values (?)");
    for (const t of times) insert.run(t);
  })();
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function setMacJobInstalled(install: boolean): Promise<ReminderResult> {
  try {
    if (install) {
      await installReminderJob({
        projectDir: process.cwd(),
        nodePath: process.execPath,
        dbPath: path.resolve(DB_PATH),
      });
    } else {
      await uninstallReminderJob();
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "launchctl failed." };
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function sendTestMacNotification(): Promise<ReminderResult> {
  try {
    await notifyMac("LeetMaxxing", "Test notification — macOS reminders are working.", "/settings");
    return { success: true, message: "Sent. Not seeing it? Check System Settings → Notifications." };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Couldn't show the notification." };
  }
}
