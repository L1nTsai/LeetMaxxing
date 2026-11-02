"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { leetcodeUrl } from "@/lib/constants";
import { formatMinutes, RATING_LABEL, RATING_STYLE } from "@/lib/attempts";
import { DifficultyBadge } from "@/components/ui";
import ActivityGraph, { ActivityLegend } from "@/components/ActivityGraph";
import { getActivityLog } from "./actions";
import type { ActivityAttempt } from "./actions";

export type DailyActivity = { day: string; problems_count: number; new_count: number; review_count: number };

type Props = {
  daily: DailyActivity[];
  endDay: string;
  currentStreak: number;
  longestStreak: number;
};

const dayHeadingFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type LogState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; rows: ActivityAttempt[] };

/** Contents of the Activity popup: year stats, a clickable graph, and the attempt log. */
export default function ActivityPanel({ daily, endDay, currentStreak, longestStreak }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [log, setLog] = useState<LogState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getActivityLog(selectedDay).then(
      (rows) => { if (!cancelled) setLog({ status: "ready", rows }); },
      (err: unknown) => {
        if (!cancelled) setLog({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
      },
    );
    return () => { cancelled = true; };
  }, [selectedDay]);

  const selectDay = (day: string | null) => {
    setLog({ status: "loading" });
    setSelectedDay((cur) => (cur === day ? null : day));
  };

  const counts = Object.fromEntries(daily.map((d) => [d.day, d.problems_count]));
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const total = daily.reduce((n, d) => n + d.problems_count, 0);
  const activeDays = daily.filter((d) => d.problems_count > 0).length;

  // Group by day, newest first (rows arrive sorted).
  const groups: { day: string; rows: ActivityAttempt[] }[] = [];
  if (log.status === "ready") {
    for (const r of log.rows) {
      const last = groups.at(-1);
      if (last?.day === r.day) last.rows.push(r);
      else groups.push({ day: r.day, rows: [r] });
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Problems logged" value={total} hint="past year" />
          <Stat label="Active days" value={activeDays} hint="past year" />
          <Stat label="Current streak" value={currentStreak} hint={currentStreak === 1 ? "day" : "days"} />
          <Stat label="Longest streak" value={longestStreak} hint={longestStreak === 1 ? "day" : "days"} />
        </div>
        <ActivityGraph counts={counts} endDay={endDay} selectedDay={selectedDay} onSelectDay={selectDay} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] text-foreground-tertiary">Click a day to see what you did.</p>
          <ActivityLegend />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-medium">
            {selectedDay ? dayHeadingFmt.format(toDate(selectedDay)) : "All activity"}
          </h3>
          {selectedDay && (
            <button
              type="button"
              onClick={() => selectDay(null)}
              className="text-xs text-foreground-secondary hover:text-foreground transition-colors"
            >
              Show all
            </button>
          )}
        </div>

        {log.status === "loading" ? (
          <p className="text-sm text-foreground-tertiary">Loading…</p>
        ) : log.status === "error" ? (
          <p className="text-sm text-danger">Couldn’t load activity: {log.message}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-foreground-secondary">
            {selectedDay ? "Nothing logged on this day." : "Nothing logged yet. Start a problem from one of your lists."}
          </p>
        ) : (
          groups.map((g) => {
            const a = byDay.get(g.day);
            return (
              <div key={g.day} className="rounded-lg border border-border">
                {!selectedDay && (
                  <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => selectDay(g.day)}
                      className="text-sm font-medium hover:underline"
                    >
                      {dayHeadingFmt.format(toDate(g.day))}
                    </button>
                    {a && (
                      <span className="text-xs text-foreground-secondary tabular-nums">
                        {a.new_count} new · {a.review_count} review{a.review_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}
                <ol className="divide-y divide-border">
                  {g.rows.map((r) => <AttemptItem key={r.id} attempt={r} />)}
                </ol>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value} <span className="text-sm font-normal text-foreground-tertiary">{hint}</span>
      </p>
    </div>
  );
}

function AttemptItem({ attempt: a }: { attempt: ActivityAttempt }) {
  const meta = [
    a.timeMinutes ? formatMinutes(a.timeMinutes) : null,
    a.usedHints ? "Used hints" : null,
    a.viewedSolution ? "Viewed solution" : null,
  ].filter(Boolean);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="w-16 shrink-0 text-xs text-foreground-tertiary tabular-nums">
          {timeFmt.format(new Date(a.createdAt))}
        </span>
        <a
          href={leetcodeUrl(a.problemSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-accent transition-colors"
        >
          {a.problemTitle}
        </a>
        <DifficultyBadge difficulty={a.difficulty} />
        {/* Square-ish and prefixed so it doesn't read as a second difficulty badge */}
        <span
          className={`inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium ${RATING_STYLE[a.rating]}`}
          title="How it went"
        >
          Rated {RATING_LABEL[a.rating]}
        </span>
        <Link href={`/lists/${a.listSlug}`} className="text-xs text-foreground-secondary hover:text-foreground transition-colors">
          {a.listName}
        </Link>
        {meta.length > 0 && <span className="ml-auto text-xs text-foreground-tertiary">{meta.join(" · ")}</span>}
      </div>
      {a.notes && (
        <p className="mt-2 ml-[76px] whitespace-pre-wrap break-words text-sm text-foreground-secondary">{a.notes}</p>
      )}
    </li>
  );
}
