"use server";

import { db } from "@/lib/db";
import { localDay } from "@/lib/day";
import type { Rating } from "@/lib/attempts";

export type ActivityAttempt = {
  id: number;
  day: string; // local YYYY-MM-DD
  createdAt: string;
  rating: Rating;
  timeMinutes: number | null;
  usedHints: boolean;
  viewedSolution: boolean;
  notes: string | null;
  problemSlug: string;
  problemTitle: string;
  difficulty: "easy" | "medium" | "hard";
  listSlug: string;
  listName: string;
};

const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Logged attempts, newest first: one local day, or the past 53 weeks when `day` is null. */
export async function getActivityLog(day: string | null): Promise<ActivityAttempt[]> {
  const selected = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  // Attempts are stored with UTC timestamps; select by local-day boundaries.
  const from = toDate(selected ?? localDay(new Date(), -371));
  const to = toDate(selected ? localDay(toDate(selected), 1) : localDay(new Date(), 1));

  const rows = db().prepare(`
    select a.id, a.created_at, a.rating, a.time_minutes, a.used_hints, a.viewed_solution, a.notes,
           p.slug as problem_slug, p.title as problem_title, p.difficulty,
           l.slug as list_slug, l.name as list_name
    from attempts a
    join problems p on p.id = a.problem_id
    join lists l on l.id = a.list_id
    where a.created_at >= ? and a.created_at < ?
    order by a.created_at desc, a.id desc
  `).all(from.toISOString(), to.toISOString()) as {
    id: number; created_at: string; rating: Rating; time_minutes: number | null;
    used_hints: number; viewed_solution: number; notes: string | null;
    problem_slug: string; problem_title: string; difficulty: "easy" | "medium" | "hard";
    list_slug: string; list_name: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    day: localDay(new Date(r.created_at)),
    createdAt: r.created_at,
    rating: r.rating,
    timeMinutes: r.time_minutes,
    usedHints: r.used_hints === 1,
    viewedSolution: r.viewed_solution === 1,
    notes: r.notes,
    problemSlug: r.problem_slug,
    problemTitle: r.problem_title,
    difficulty: r.difficulty,
    listSlug: r.list_slug,
    listName: r.list_name,
  }));
}
