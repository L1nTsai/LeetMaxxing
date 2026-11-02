import Link from "next/link";
import { localDay } from "@/lib/day";

type Props = {
  /** Problems logged per day, keyed by YYYY-MM-DD. */
  counts: Record<string, number>;
  /** Last day shown (YYYY-MM-DD), normally today. */
  endDay: string;
  /** If given, each day links here (e.g. to filter a log by that day). */
  dayHref?: (day: string) => string;
  /** If given (client components only), each day is a button calling this. */
  onSelectDay?: (day: string) => void;
  /** Highlighted day. */
  selectedDay?: string | null;
};

const WEEKS = 53;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]; // rows are Sun → Sat
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short" });
const titleFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/** YYYY-MM-DD → a local Date at midnight. */
const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * GitHub-style contribution graph: one column per week (Sunday on top), months
 * labelled along the top, Mon/Wed/Fri down the left. Cells stretch to fill the
 * available width.
 */
export default function ActivityGraph({ counts, endDay, dayHref, onSelectDay, selectedDay }: Props) {
  const end = toDate(endDay);
  // Start on the Sunday WEEKS-1 weeks before the end day's week.
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - end.getDay() - (WEEKS - 1) * 7);

  const weeks: ({ day: string; count: number; date: Date } | null)[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      if (date > end) { col.push(null); continue; }
      const day = localDay(date);
      col.push({ day, count: counts[day] ?? 0, date });
    }
    weeks.push(col);
  }

  // Month labels go on the column that contains the 1st of that month, and
  // on the first column too if there's room before the next label.
  const months: { col: number; label: string }[] = [];
  weeks.forEach((col, w) => {
    const first = col.find((c) => c && c.date.getDate() === 1);
    if (first) months.push({ col: w, label: monthFmt.format(first.date) });
  });
  if (!months.length || months[0].col >= 3) {
    months.unshift({ col: 0, label: monthFmt.format(weeks[0][0]!.date) });
  }

  return (
    <div
      className="grid gap-[3px] text-[10px] leading-none text-foreground-tertiary"
      style={{ gridTemplateColumns: `auto repeat(${WEEKS}, minmax(0, 1fr))` }}
    >
      {/* Month row */}
      {months.map((m) => (
        <span
          key={`${m.col}-${m.label}`}
          className="whitespace-nowrap pb-1"
          style={{ gridRow: 1, gridColumn: `${m.col + 2} / span 3` }}
        >
          {m.label}
        </span>
      ))}

      {/* Day-of-week labels */}
      {DAY_LABELS.map((label, d) => (
        <span key={d} className="flex items-center pr-1.5" style={{ gridRow: d + 2, gridColumn: 1 }}>
          {label}
        </span>
      ))}

      {/* Cells */}
      {weeks.flatMap((col, w) =>
        col.map((cell, d) => {
          const pos = { gridRow: d + 2, gridColumn: w + 2 };
          if (!cell) return <span key={`${w}-${d}`} style={pos} />;
          const title = `${titleFmt.format(cell.date)}: ${cell.count} problem${cell.count === 1 ? "" : "s"}`;
          const selected = cell.day === selectedDay;
          const className = `aspect-square rounded-[2px] ${selected ? "outline-2 outline-offset-1 outline-foreground" : ""}`;
          const style = { ...pos, background: activityColor(cell.count) };
          const hover = "hover:outline-1 hover:outline-offset-1 hover:outline-foreground-tertiary";
          if (onSelectDay) {
            return (
              <button
                key={cell.day}
                type="button"
                onClick={() => onSelectDay(cell.day)}
                title={title}
                aria-label={title}
                aria-pressed={selected}
                className={`${className} ${hover}`}
                style={style}
              />
            );
          }
          return dayHref ? (
            <Link
              key={cell.day}
              href={dayHref(cell.day)}
              scroll={false}
              title={title}
              aria-label={title}
              className={`${className} ${hover}`}
              style={style}
            />
          ) : (
            <span key={cell.day} title={title} className={className} style={style} />
          );
        }),
      )}
    </div>
  );
}

export function ActivityLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-foreground-tertiary">
      <span className="mr-0.5">Less</span>
      {[0, 1, 3, 5, 8].map((v) => (
        <span key={v} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: activityColor(v) }} />
      ))}
      <span className="ml-0.5">More</span>
    </div>
  );
}

export function activityColor(count: number): string {
  if (count === 0) return "var(--muted)";
  if (count <= 2) return "color-mix(in srgb, var(--success) 30%, var(--background))";
  if (count <= 4) return "color-mix(in srgb, var(--success) 55%, var(--background))";
  if (count <= 7) return "color-mix(in srgb, var(--success) 80%, var(--background))";
  return "var(--success)";
}
