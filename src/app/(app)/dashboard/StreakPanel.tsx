import { localDay } from "@/lib/day";

type Day = { day: string; problems_count: number; goal_met: 0 | 1 };

type Props = {
  days: Day[];
  today: string;
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  dailyTarget: number;
  months?: number;
};

const monthFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** First day of the month `back` months before `today`, as YYYY-MM-DD. */
export function streakHistoryStart(today: string, months = 4) {
  const t = toDate(today);
  return localDay(new Date(t.getFullYear(), t.getMonth() - (months - 1), 1));
}

/** Contents of the Streak popup: totals plus month calendars marking goal days. */
export default function StreakPanel({
  days, today, currentStreak, longestStreak, freezes, dailyTarget, months = 4,
}: Props) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const t = toDate(today);
  const monthStarts = Array.from({ length: months }, (_, i) => new Date(t.getFullYear(), t.getMonth() - (months - 1) + i, 1));
  const goalDays = days.filter((d) => d.goal_met).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Current streak" value={currentStreak} hint={currentStreak === 1 ? "day" : "days"} />
        <Stat label="Longest streak" value={longestStreak} hint={longestStreak === 1 ? "day" : "days"} />
        <Stat label={`Goal days (${months} mo)`} value={goalDays} hint={goalDays === 1 ? "day" : "days"} />
      </div>

      <p className="text-xs text-foreground-secondary">
        A day counts when you log {dailyTarget} problem{dailyTarget === 1 ? "" : "s"} (your daily goal).
        {freezes > 0 && ` You have ${freezes} streak freeze${freezes === 1 ? "" : "s"} saved up.`}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {monthStarts.map((start) => (
          <Month key={start.getMonth()} start={start} byDay={byDay} today={today} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-foreground-tertiary">
        <Legend className="bg-success" label="Goal reached" />
        <Legend className="border border-border-strong" label="Some activity" />
        <Legend className="ring-1 ring-foreground" label="Today" />
      </div>
    </div>
  );
}

function Month({ start, byDay, today }: { start: Date; byDay: Map<string, Day>; today: string }) {
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: start.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => localDay(new Date(start.getFullYear(), start.getMonth(), i + 1))),
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-medium">{monthFmt.format(start)}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-foreground-tertiary">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`pad-${i}`} />;
          const d = byDay.get(day);
          const future = day > today;
          const met = d?.goal_met === 1;
          const some = !met && (d?.problems_count ?? 0) > 0;
          const title = future
            ? dayFmt.format(toDate(day))
            : `${dayFmt.format(toDate(day))}: ${d?.problems_count ?? 0} logged${met ? " · goal reached" : ""}`;
          return (
            <span
              key={day}
              title={title}
              className={[
                "flex aspect-square items-center justify-center rounded-md tabular-nums",
                met ? "bg-success font-semibold text-background" : "",
                some ? "border border-border-strong text-foreground" : "",
                !met && !some ? (future ? "text-border-strong" : "text-foreground-tertiary") : "",
                day === today ? "ring-1 ring-foreground" : "",
              ].join(" ")}
            >
              {Number(day.slice(8))}
            </span>
          );
        })}
      </div>
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

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-[3px] ${className}`} />
      {label}
    </span>
  );
}
