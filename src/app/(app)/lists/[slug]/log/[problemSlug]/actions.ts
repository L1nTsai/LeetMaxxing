"use server";

import { db } from "@/lib/db";
import { localDay } from "@/lib/day";
import type { DB } from "@/lib/db";
import { applySpacedRepetition, isPass } from "@/lib/srs";
import type { Rating, SrsMethod } from "@/lib/srs";

/** What was saved, for the summary shown after logging. */
export type LoggedAttempt = {
  rating: Rating;
  timeMinutes: number | null;
  usedHints: boolean;
  viewedSolution: boolean;
  notes: string | null;
  status: "attempted" | "solved";
  isReview: boolean;
  dueOn: string | null;
  intervalDays: number;
};

export type LogResult = { success: true; logged: LoggedAttempt } | { success: false; error: string };

const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

export async function logAttempt(_prev: LogResult | null, formData: FormData): Promise<LogResult> {
  const listId = Number(formData.get("listId"));
  const problemId = Number(formData.get("problemId"));
  const rating = formData.get("rating") as Rating;
  const timeRaw = formData.get("time_minutes");
  const timeMinutes = timeRaw ? Number(timeRaw) || null : null;
  const usedHints = formData.get("used_hints") === "true";
  const viewedSolution = formData.get("viewed_solution") === "true";
  const notes = ((formData.get("notes") as string | null) ?? "").trim() || null;

  if (!RATINGS.includes(rating)) return { success: false, error: "Pick how it went." };
  if (timeMinutes !== null && (!Number.isInteger(timeMinutes) || timeMinutes < 1 || timeMinutes > 300)) {
    return { success: false, error: "Time must be between 1 and 300 minutes." };
  }

  const conn = db();
  let logged: LoggedAttempt;
  try {
    // One transaction: the attempt, progress, activity and streak all land together or not at all.
    conn.transaction(() => {
      conn.prepare(`
        insert into attempts (list_id, problem_id, rating, time_minutes, used_hints, viewed_solution, notes)
        values (?, ?, ?, ?, ?, ?, ?)
      `).run(listId, problemId, rating, timeMinutes, usedHints ? 1 : 0, viewedSolution ? 1 : 0, notes);

      const existing = conn.prepare(`
        select repetitions, ease_factor, interval_days from list_entries
        where list_id = ? and problem_id = ?
      `).get(listId, problemId) as { repetitions: number; ease_factor: number; interval_days: number } | undefined;

      // It's a review if the problem was previously solved (repetitions > 0).
      const isReview = existing != null && existing.repetitions > 0;

      const settings = conn.prepare("select daily_target, srs_method, srs_intervals from settings where id = 1")
        .get() as { daily_target: number; srs_method: SrsMethod; srs_intervals: string };

      const currentState = existing ?? { repetitions: 0, ease_factor: 2.5, interval_days: 0 };
      const srs = applySpacedRepetition(currentState, rating, settings.srs_method, JSON.parse(settings.srs_intervals));
      const status = isPass(rating) ? "solved" : "attempted";
      logged = {
        rating, timeMinutes, usedHints, viewedSolution, notes,
        status, isReview, dueOn: srs.due_on, intervalDays: srs.interval_days,
      };
      const now = new Date().toISOString();

      conn.prepare(`
        insert into list_entries
          (list_id, problem_id, status, solved_at, repetitions, ease_factor, interval_days, due_on, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict (list_id, problem_id) do update set
          status = excluded.status, solved_at = excluded.solved_at,
          repetitions = excluded.repetitions, ease_factor = excluded.ease_factor,
          interval_days = excluded.interval_days, due_on = excluded.due_on,
          updated_at = excluded.updated_at
      `).run(
        listId, problemId, status, status === "solved" ? now : null,
        srs.repetitions, srs.ease_factor, srs.interval_days, srs.due_on, now,
      );

      // Daily activity with new vs. review breakdown.
      const today = localDay();
      const activity = conn.prepare(`
        insert into daily_activity (day, problems_count, new_count, review_count)
        values (?, 1, ?, ?)
        on conflict (day) do update set
          problems_count = problems_count + 1,
          new_count = new_count + excluded.new_count,
          review_count = review_count + excluded.review_count
        returning problems_count
      `).get(today, isReview ? 0 : 1, isReview ? 1 : 0) as { problems_count: number };

      const goalMet = activity.problems_count >= settings.daily_target;
      conn.prepare("update daily_activity set goal_met = ? where day = ?").run(goalMet ? 1 : 0, today);
      if (goalMet) updateStreak(conn, today);
    })();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Couldn't save the attempt." };
  }

  return { success: true, logged: logged! };
}

function updateStreak(conn: DB, today: string) {
  const streak = conn.prepare("select current_streak, longest_streak, last_evaluated_day from streak where id = 1")
    .get() as { current_streak: number; longest_streak: number; last_evaluated_day: string | null };

  if (streak.last_evaluated_day === today) return;

  const yesterdayStr = localDay(new Date(), -1);

  const lastDay = streak.last_evaluated_day;
  const continuing = lastDay === yesterdayStr || (streak.current_streak === 0 && !lastDay);
  const newStreak = continuing ? streak.current_streak + 1 : 1;

  conn.prepare(`
    update streak set current_streak = ?, longest_streak = ?, last_evaluated_day = ? where id = 1
  `).run(newStreak, Math.max(streak.longest_streak, newStreak), today);
}

export type Attempt = {
  id: number;
  rating: Rating;
  time_minutes: number | null;
  used_hints: boolean;
  viewed_solution: boolean;
  notes: string | null;
  created_at: string;
};

/** Past attempts (newest first) for one problem in one list. */
export async function getAttempts(listId: number, problemId: number): Promise<Attempt[]> {
  const rows = db().prepare(`
    select id, rating, time_minutes, used_hints, viewed_solution, notes, created_at
    from attempts
    where list_id = ? and problem_id = ?
    order by created_at desc, id desc
    limit 50
  `).all(Number(listId), Number(problemId)) as (Omit<Attempt, "used_hints" | "viewed_solution"> & {
    used_hints: number;
    viewed_solution: number;
  })[];
  return rows.map((r) => ({ ...r, used_hints: r.used_hints === 1, viewed_solution: r.viewed_solution === 1 }));
}
