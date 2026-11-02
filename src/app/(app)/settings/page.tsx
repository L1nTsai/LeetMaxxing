import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import { SRS_METHODS, LEITNER_INTERVALS, INTERVALS_2357 } from "@/lib/srs";
import type { SrsMethod } from "@/lib/srs";
import SrsForm from "./SrsForm";
import ReminderForm from "./ReminderForm";
import { getReminderSettings } from "@/lib/reminders";
import { isReminderJobInstalled } from "@/lib/mac";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await getDb();
  const settings = db.prepare("select srs_method, srs_intervals from settings where id = 1")
    .get() as { srs_method: SrsMethod; srs_intervals: string };

  const method = settings.srs_method;
  const intervals: number[] = JSON.parse(settings.srs_intervals);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 space-y-8">
      <h1 className="text-lg font-semibold">Settings</h1>

      {/* Reminders section */}
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium">Daily reminder</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            A nudge at your chosen time if you haven&apos;t hit today&apos;s goal. Sent once a day, by whichever channel gets there first.
          </p>
        </div>

        <ReminderForm settings={getReminderSettings(db)} macJobInstalled={isReminderJobInstalled()} />
      </section>

      {/* SRS section */}
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium">Spaced repetition method</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Controls how soon problems come back for review after you log them.
          </p>
        </div>

        <SrsForm
          method={method}
          intervals={intervals}
          leitnerIntervals={LEITNER_INTERVALS}
          intervals2357={INTERVALS_2357}
          methods={SRS_METHODS}
        />
      </section>
    </div>
  );
}
