// Daily reminder logic, shared by the app (browser notifications) and the
// background macOS job (scripts/remind.ts). No Next.js imports here: the job
// runs under plain Node, so imports are relative with .ts extensions.

import type Database from "better-sqlite3";
import { localDay, localTime } from "./day.ts";

type DB = Database.Database;
export type Channel = "browser" | "mac";

export type ReminderSettings = {
  reminders_enabled: boolean;
  reminder_times: string[]; // HH:MM, local, sorted
  notify_browser: boolean;
  notify_mac: boolean;
};

export type ReminderMessage = { title: string; body: string; url: string };

/** An open tab counts as present for this long after its last check-in. */
export const BROWSER_PRESENCE_MS = 3 * 60_000;

export const MAX_REMINDER_TIMES = 8;

export function getReminderSettings(db: DB): ReminderSettings {
  const row = db.prepare(`
    select reminders_enabled, notify_browser, notify_mac
    from settings where id = 1
  `).get() as { reminders_enabled: number; notify_browser: number; notify_mac: number };
  const times = db.prepare("select time from reminder_times order by time").pluck().all() as string[];
  return {
    reminders_enabled: row.reminders_enabled === 1,
    reminder_times: times,
    notify_browser: row.notify_browser === 1,
    notify_mac: row.notify_mac === 1,
  };
}

/** Today's progress, phrased as a nudge. `goalMet` means there's nothing to nag about. */
export function buildReminder(db: DB, now = new Date()): ReminderMessage & { goalMet: boolean } {
  const today = localDay(now);
  const { daily_target: target } = db.prepare("select daily_target from settings where id = 1")
    .get() as { daily_target: number };
  const done = (db.prepare("select problems_count from daily_activity where day = ?")
    .get(today) as { problems_count: number } | undefined)?.problems_count ?? 0;
  const { current_streak: streak } = db.prepare("select current_streak from streak where id = 1")
    .get() as { current_streak: number };
  const { n: dueReviews } = db.prepare(
    "select count(*) as n from list_entries where status = 'solved' and due_on <= ?",
  ).get(today) as { n: number };

  const left = Math.max(target - done, 0);
  const parts = [`${done}/${target} done today — ${left} to go.`];
  if (streak > 0) parts.push(`Keep your ${streak}-day streak alive before midnight.`);
  if (dueReviews > 0) parts.push(`${dueReviews} review${dueReviews === 1 ? "" : "s"} due.`);

  return {
    title: done === 0 ? "Time for LeetMaxxing" : "Finish today's goal",
    body: parts.join(" "),
    url: dueReviews > 0 ? "/reviews" : "/lists",
    goalMet: done >= target,
  };
}

/**
 * If a reminder should go out now on `channel`, claims it and returns the
 * message; otherwise null. Only the latest time that has passed counts: after
 * a sleep that skipped 12:00 and 18:00, waking at 19:00 sends one reminder,
 * not two. Claiming is atomic, so the browser and macOS job never both send.
 */
export function claimDueReminder(db: DB, channel: Channel, now = new Date()): ReminderMessage | null {
  const s = getReminderSettings(db);
  if (!s.reminders_enabled) return null;
  if (channel === "browser" ? !s.notify_browser : !s.notify_mac) return null;
  const nowTime = localTime(now);
  const slot = s.reminder_times.filter((t) => t <= nowTime).at(-1);
  if (!slot) return null;

  const msg = buildReminder(db, now);
  if (msg.goalMet) return null;

  const claimed = db.prepare(
    "insert or ignore into reminder_log (day, slot, channel) values (?, ?, ?)",
  ).run(localDay(now), slot, channel).changes === 1;
  if (claimed) claimedSlots.set(channel, slot);
  return claimed ? { title: msg.title, body: msg.body, url: msg.url } : null;
}

// Last slot each channel claimed in this process, so a failed send can be released.
const claimedSlots = new Map<Channel, string>();

/** Gives the last claimed reminder back, e.g. when the notification couldn't be shown. */
export function releaseReminder(db: DB, channel: Channel, now = new Date()) {
  const slot = claimedSlots.get(channel);
  if (!slot) return;
  db.prepare("delete from reminder_log where day = ? and slot = ? and channel = ?")
    .run(localDay(now), slot, channel);
  claimedSlots.delete(channel);
}

export function markBrowserPresent(db: DB, now = new Date()) {
  db.prepare("update app_presence set browser_seen_at = ? where id = 1").run(now.toISOString());
}

export function isBrowserPresent(db: DB, now = new Date()): boolean {
  const row = db.prepare("select browser_seen_at from app_presence where id = 1")
    .get() as { browser_seen_at: string | null };
  return row.browser_seen_at != null && now.getTime() - Date.parse(row.browser_seen_at) < BROWSER_PRESENCE_MS;
}
