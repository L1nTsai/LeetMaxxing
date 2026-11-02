import Link from "next/link";
import { localDay } from "@/lib/day";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import GoalCard from "./GoalCard";
import ActivityGraph, { ActivityLegend } from "@/components/ActivityGraph";
import FlipCard from "@/components/FlipCard";
import ActivityPanel from "./ActivityPanel";
import type { DailyActivity } from "./ActivityPanel";
import StreakPanel, { streakHistoryStart } from "./StreakPanel";
import Tour from "@/components/Tour";
import { NotificationSetup } from "@/components/NotificationCards";
import { getReminderSettings } from "@/lib/reminders";
import { isReminderJobInstalled } from "@/lib/mac";
import type { TourStep } from "@/components/Tour";

export const metadata: Metadata = { title: "Dashboard" };

/** The dashboard shows at most two rows of two starred lists. */
const DASHBOARD_LIST_SLOTS = 4;

export default async function DashboardPage() {
  const db = await getDb();
  const today = localDay();

  const graphStartStr = localDay(new Date(), -371); // 53 weeks

  const { daily_target: dailyTarget } = db.prepare("select daily_target from settings where id = 1")
    .get() as { daily_target: number };
  const streak = db.prepare("select current_streak, longest_streak, freezes_available from streak where id = 1")
    .get() as { current_streak: number; longest_streak: number; freezes_available: number };
  const todayActivity = db.prepare(
    "select problems_count, new_count, review_count, goal_met from daily_activity where day = ?",
  ).get(today) as { problems_count: number; new_count: number; review_count: number; goal_met: 0 | 1 } | undefined;
  const activityRows = db.prepare(
    "select day, problems_count, new_count, review_count, goal_met from daily_activity where day >= ? order by day",
  ).all(graphStartStr) as (DailyActivity & { goal_met: 0 | 1 })[];
  const streakStart = streakHistoryStart(today);
  const streakDays = activityRows.filter((r) => r.day >= streakStart);

  // Starred lists (the ones pinned to the dashboard) with progress counts.
  // The dashboard has a fixed 2×2 grid; the rest are on the Lists page.
  const { starredCount } = db.prepare("select count(*) as starredCount from lists where starred = 1")
    .get() as { starredCount: number };
  const listStats = db.prepare(`
    select l.id, l.slug, l.name, l.description,
           (select count(*) from list_problems lp where lp.list_id = l.id) as total,
           (select count(*) from list_entries e where e.list_id = l.id and e.status = 'solved') as solved
    from lists l
    where l.starred = 1
    order by l.position
    limit ${DASHBOARD_LIST_SLOTS}
  `).all() as { id: number; slug: string; name: string; description: string; total: number; solved: number }[];

  const reminders = getReminderSettings(db);

  const todayCount = todayActivity?.problems_count ?? 0;
  const todayNew = todayActivity?.new_count ?? 0;
  const todayReviews = todayActivity?.review_count ?? 0;
  const currentStreak = streak.current_streak;
  const longestStreak = streak.longest_streak;

  const activityCounts = Object.fromEntries(activityRows.map((r) => [r.day, r.problems_count]));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8">
      <Tour steps={TOUR_STEPS} />

      {/* Daily goal + streak */}
      <div className="grid grid-cols-2 gap-4">
        <GoalCard target={dailyTarget}>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm text-foreground-secondary">Today&apos;s goal</p>
            <p className="text-sm font-medium tabular-nums flex items-center gap-1">
              {todayCount}
              <span className="text-foreground-tertiary font-normal">/ {dailyTarget}</span>
            </p>
          </div>
          <GoalBar value={todayCount} max={dailyTarget} />

          {/* Breakdown */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <p className="text-2xl font-bold tabular-nums">{todayNew}</p>
              <p className="text-xs text-foreground-secondary mt-0.5">new solved</p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1">
              <p className="text-2xl font-bold tabular-nums">{todayReviews}</p>
              <p className="text-xs text-foreground-secondary mt-0.5">reviewed</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-foreground-tertiary">
            {todayActivity?.goal_met
              ? "Goal reached!"
              : `${dailyTarget - todayCount} more to reach ${dailyTarget}`}
          </p>
        </GoalCard>
        <FlipCard
          title="Streak"
          label={`Current streak ${currentStreak} days. Click for streak history.`}
          panel={
            <StreakPanel
              days={streakDays}
              today={today}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              freezes={streak.freezes_available}
              dailyTarget={dailyTarget}
            />
          }
          data-tour="streak"
        >
          <p className="text-sm text-foreground-secondary mb-1">Current streak</p>
          <p className="text-4xl font-bold tabular-nums mb-1">
            {currentStreak}
            <span className="text-xl font-normal text-foreground-secondary ml-1">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="text-sm text-foreground-secondary">
            Longest: {longestStreak} {longestStreak === 1 ? "day" : "days"}
          </p>
        </FlipCard>
      </div>

      {/* Lists */}
      <div data-tour="lists">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm font-medium">Lists</p>
          <Link
            href="/lists"
            className="text-xs text-foreground-secondary hover:text-foreground transition-colors"
          >
            {starredCount > DASHBOARD_LIST_SLOTS
              ? `+${starredCount - DASHBOARD_LIST_SLOTS} more · All lists →`
              : "All lists →"}
          </Link>
        </div>
        <div className="grid grid-cols-2 auto-rows-fr gap-3">
          {listStats.map((list) => {
            const pct = list.total === 0 ? 0 : Math.round((list.solved / list.total) * 100);
            return (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="group relative overflow-hidden rounded-lg border border-border p-5 transition-colors hover:border-border-strong hover:bg-background-subtle"
              >
                {/* Default state: name + count */}
                <div className="transition-opacity duration-150 group-hover:opacity-0">
                  <p className="font-medium text-sm mb-1">{list.name}</p>
                  <p className="text-xs text-foreground-secondary">
                    {list.solved} / {list.total} solved
                  </p>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Hover state: big percentage + start prompt */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <p className="text-3xl font-bold tabular-nums">{pct}%</p>
                  <p className="text-xs text-foreground-secondary mt-1">
                    {list.solved === 0 ? "Start now" : "Continue"}
                  </p>
                </div>
              </Link>
            );
          })}
          {/* Empty slots keep the grid at two full rows. */}
          {Array.from({ length: DASHBOARD_LIST_SLOTS - listStats.length }, (_, i) => (
            <Link
              key={`empty-${i}`}
              href="/lists"
              className="flex items-center justify-center rounded-lg border border-dashed border-border p-5 text-xs text-foreground-tertiary transition-colors hover:border-border-strong hover:bg-background-subtle hover:text-foreground-secondary"
            >
              ☆ Star a list to pin it here
            </Link>
          ))}
        </div>
      </div>

      {/* Activity graph: the whole card flips open into the activity log */}
      <FlipCard
        title="Activity"
        label="Activity graph. Click to see all activity."
        panelWidth="max-w-4xl"
        panel={
          <ActivityPanel
            daily={activityRows.map(({ day, problems_count, new_count, review_count }) => ({ day, problems_count, new_count, review_count }))}
            endDay={today}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        }
        data-tour="activity"
      >
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-medium">Activity</p>
          <span className="text-xs text-foreground-secondary">View all activity →</span>
        </div>
        <ActivityGraph counts={activityCounts} endDay={today} />
        <div className="mt-3 flex justify-end">
          <ActivityLegend />
        </div>
      </FlipCard>

      {reminders.reminders_enabled && (
        <NotificationSetup
          browserWanted={reminders.notify_browser}
          macWanted={reminders.notify_mac}
          macInstalled={isReminderJobInstalled()}
        />
      )}
    </div>
  );
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to LeetMaxxing",
    body: "Here's a quick look at what you can do. It takes about a minute.",
  },
  {
    target: "goal",
    title: "Daily goal",
    body: "Track how many problems you solve or review each day. Click the card to change your target.",
  },
  {
    target: "streak",
    title: "Streaks",
    body: "Hit your daily goal on consecutive days to build a streak. Your longest run is kept here too.",
  },
  {
    target: "lists",
    title: "Your lists",
    body: "Starred lists show up here. Star or import more from the Lists page. Open a list to see its topic roadmap. Click a topic to jump to its problems, solve one on LeetCode, then press “Log” to record how it went.",
  },
  {
    target: "activity",
    title: "Activity",
    body: "Every problem you log shows up here, so you can see your consistency over the past year. Click it to see the full log.",
  },
  {
    target: "nav-reviews",
    title: "Reviews",
    body: "Solved problems come back on a spaced-repetition schedule. Anything due today shows up here.",
  },
  {
    target: "nav-settings",
    title: "Settings",
    body: "Choose how reviews are scheduled: SM-2, Leitner, 2-3-5-7, or your own custom intervals.",
  },
  {
    target: "tour-button",
    title: "That's it",
    body: "You can replay this tour anytime from here.",
  },
];

function GoalBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, max === 0 ? 0 : Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "var(--foreground)" }}
      />
    </div>
  );
}
