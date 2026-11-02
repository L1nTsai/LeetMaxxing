// macOS integration: native notifications and the launchd job that sends the
// daily reminder while the app is closed. Node-only (no Next.js imports), used
// by scripts/remind.ts and by the settings page's server actions.

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const LAUNCHD_LABEL = "com.leetmaxxing.reminder";
export const PLIST_PATH = path.join(homedir(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
/** How often launchd runs the check. It also runs on wake if a run was missed. */
export const CHECK_INTERVAL_SECONDS = 300;

export const APP_URL = process.env.LEETMAXXING_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const NOTIFIER_CANDIDATES = ["/opt/homebrew/bin/terminal-notifier", "/usr/local/bin/terminal-notifier"];

/**
 * Shows a macOS notification. Uses terminal-notifier when installed (clicking
 * opens the app), otherwise AppleScript (clicking opens Script Editor).
 * Arguments go through execFile, never a shell, so text can't inject commands.
 */
export async function notifyMac(title: string, body: string, urlPath = "/dashboard") {
  const notifier = NOTIFIER_CANDIDATES.find((p) => existsSync(p));
  if (notifier) {
    await run(notifier, [
      "-title", title, "-message", body, "-open", new URL(urlPath, APP_URL).href,
      "-group", LAUNCHD_LABEL, "-sound", "default",
    ]);
    return;
  }
  await run("/usr/bin/osascript", [
    "-e", "on run argv",
    "-e", 'display notification (item 2 of argv) with title (item 1 of argv) sound name "default"',
    "-e", "end run",
    title, body,
  ]);
}

export function isReminderJobInstalled(): boolean {
  return existsSync(PLIST_PATH);
}

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Installs (or reinstalls) the per-user launchd job. Paths are absolute
 * because launchd starts with an empty environment.
 */
export async function installReminderJob(opts: { projectDir: string; nodePath: string; dbPath: string }) {
  const script = path.join(opts.projectDir, "scripts", "remind.ts");
  const log = path.join(path.dirname(opts.dbPath), "reminder.log");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(opts.nodePath)}</string>
    <string>${xml(script)}</string>
  </array>
  <key>WorkingDirectory</key><string>${xml(opts.projectDir)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>LEETMAXXING_DB_PATH</key><string>${xml(opts.dbPath)}</string>
    <key>LEETMAXXING_URL</key><string>${xml(APP_URL)}</string>
  </dict>
  <key>StartInterval</key><integer>${CHECK_INTERVAL_SECONDS}</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${xml(log)}</string>
  <key>StandardErrorPath</key><string>${xml(log)}</string>
</dict>
</plist>
`;
  mkdirSync(path.dirname(PLIST_PATH), { recursive: true });
  await bootout();
  writeFileSync(PLIST_PATH, plist);
  await run("/bin/launchctl", ["bootstrap", `gui/${userInfo().uid}`, PLIST_PATH]);
}

export async function uninstallReminderJob() {
  await bootout();
  if (existsSync(PLIST_PATH)) unlinkSync(PLIST_PATH);
}

async function bootout() {
  // Fails when the job isn't loaded, which is fine.
  await run("/bin/launchctl", ["bootout", `gui/${userInfo().uid}/${LAUNCHD_LABEL}`]).catch(() => {});
}
