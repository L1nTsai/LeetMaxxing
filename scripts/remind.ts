// Background reminder check, run by launchd every few minutes (see src/lib/mac.ts).
// Sends today's reminder as a macOS notification when it's due and no open
// browser tab is around to show it. Also: `npm run remind` to run it by hand,
// `npm run reminders:install` / `reminders:uninstall` to manage the job.

import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "../src/lib/db/schema.ts";
import { claimDueReminder, isBrowserPresent, releaseReminder } from "../src/lib/reminders.ts";
import { installReminderJob, notifyMac, PLIST_PATH, uninstallReminderJob } from "../src/lib/mac.ts";

const projectDir = path.resolve(import.meta.dirname, "..");
const dbPath = path.resolve(process.env.LEETMAXXING_DB_PATH ?? path.join(projectDir, "data", "leetmaxxing.db"));
const stamp = () => new Date().toISOString();

async function check() {
  if (!existsSync(dbPath)) return; // app has never run; nothing to remind about

  const db = new Database(dbPath, { fileMustExist: true });
  db.pragma("busy_timeout = 5000");
  try {
    // The app applies migrations; until it has, the reminder tables don't exist.
    if ((db.pragma("user_version", { simple: true }) as number) < MIGRATIONS.length) {
      console.log(`${stamp()} database not migrated yet; open the app once`);
      return;
    }
    if (isBrowserPresent(db)) return; // an open tab will show it

    const msg = claimDueReminder(db, "mac");
    if (!msg) return;
    try {
      await notifyMac(msg.title, msg.body, msg.url);
      console.log(`${stamp()} sent: ${msg.body}`);
    } catch (err) {
      releaseReminder(db, "mac"); // retry on the next run
      throw err;
    }
  } finally {
    db.close();
  }
}

const command = process.argv[2] ?? "check";
if (command === "install") {
  await installReminderJob({ projectDir, nodePath: process.execPath, dbPath });
  console.log(`Installed ${PLIST_PATH}`);
} else if (command === "uninstall") {
  await uninstallReminderJob();
  console.log("Removed the reminder job.");
} else if (command === "test") {
  await notifyMac("LeetMaxxing", "Test notification — reminders are working.", "/settings");
} else {
  await check().catch((err) => {
    console.error(`${stamp()} reminder failed:`, err);
    process.exitCode = 1;
  });
}
