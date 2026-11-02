"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { MAX_REMINDER_TIMES } from "@/lib/reminders";
import type { ReminderSettings } from "@/lib/reminders";
import { BrowserCard, MacCard } from "@/components/NotificationCards";
import { saveReminderSettings } from "../reminders/actions";

type Props = { settings: ReminderSettings; macJobInstalled: boolean };

const small = "h-8 px-3 text-xs";

let idCounter = 0;
const nextId = () => ++idCounter;

/** A sensible default for a new row: 3 hours after the latest time, capped at 23:00. */
function suggestNext(existing: string[]): string {
  const latest = existing.toSorted().at(-1);
  if (!latest) return "20:00";
  const h = Math.min(Number(latest.slice(0, 2)) + 3, 23);
  return `${String(h).padStart(2, "0")}:00`;
}

export default function ReminderForm({ settings, macJobInstalled }: Props) {
  const [state, formAction, pending] = useActionState(saveReminderSettings, null);
  const [enabled, setEnabled] = useState(settings.reminders_enabled);
  const [times, setTimes] = useState(() => settings.reminder_times.map((value) => ({ id: nextId(), value })));

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="reminders_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-sm">Remind me every day</span>
        </label>

        {/* Dimmed, not disabled, when off: disabled inputs aren't submitted and would be lost. */}
        <div className={`space-y-4 transition-opacity ${enabled ? "" : "opacity-50"}`}>
          <div className="space-y-2">
            <p className="text-xs text-foreground-secondary">
              Times <span className="text-foreground-tertiary">— each one only fires if today&apos;s goal isn&apos;t met yet</span>
            </p>
            {times.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="time"
                  name="reminder_time"
                  value={t.value}
                  onChange={(e) => setTimes(times.map((x) => (x.id === t.id ? { ...x, value: e.target.value } : x)))}
                  required
                  aria-label="Reminder time"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm font-mono focus:border-border-strong focus:outline-none"
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTimes(times.filter((x) => x.id !== t.id))}
                    aria-label={`Remove ${t.value}`}
                    className="h-9 w-9 rounded-md text-foreground-tertiary hover:bg-muted hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {times.length < MAX_REMINDER_TIMES && (
              <button
                type="button"
                onClick={() => setTimes([...times, { id: nextId(), value: suggestNext(times.map((x) => x.value)) }])}
                className="text-xs text-foreground-secondary hover:text-foreground transition-colors"
              >
                + Add time
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="notify_browser" defaultChecked={settings.notify_browser} />
              <span className="text-sm">Browser notification <span className="text-foreground-tertiary">— while the app is open</span></span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="notify_mac" defaultChecked={settings.notify_mac} />
              <span className="text-sm">macOS notification <span className="text-foreground-tertiary">— when the app is closed</span></span>
            </label>
          </div>
        </div>

        {state && !state.success && <p className="text-xs text-danger">{state.error}</p>}
        {state?.success && <p className="text-xs text-success">Saved.</p>}

        <Button type="submit" disabled={pending} className={`${small} px-4`}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      <BrowserCard />
      <MacCard installed={macJobInstalled} />
    </div>
  );
}
