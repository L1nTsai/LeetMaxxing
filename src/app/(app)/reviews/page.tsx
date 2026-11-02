import { getDb } from "@/lib/db";
import { daysBetween, localDay } from "@/lib/day";
import { leetcodeUrl } from "@/lib/constants";
import { DifficultyBadge } from "@/components/ui";
import ReviewLogButton, { ReviewSessionProvider } from "./ReviewLogButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const db = await getDb();
  const today = localDay();

  const flat = db.prepare(`
    select e.list_id, e.problem_id, e.due_on,
           l.slug as list_slug, l.name as list_name,
           p.slug, p.title, p.difficulty, t.name as topic_name
    from list_entries e
    join lists l on l.id = e.list_id
    join problems p on p.id = e.problem_id
    join topics t on t.id = p.topic_id
    where e.status = 'solved' and e.due_on <= ?
    order by e.due_on
  `).all(today) as {
    list_id: number; problem_id: number; due_on: string;
    list_slug: string; list_name: string;
    slug: string; title: string; difficulty: string; topic_name: string;
  }[];

  type Entry = {
    list_id: number;
    problem_id: number;
    due_on: string;
    lists: { slug: string; name: string };
    problems: {
      slug: string;
      title: string;
      difficulty: string;
      topics: { name: string } | null;
    };
  };

  const rows: Entry[] = flat.map((r) => ({
    list_id: r.list_id,
    problem_id: r.problem_id,
    due_on: r.due_on,
    lists: { slug: r.list_slug, name: r.list_name },
    problems: { slug: r.slug, title: r.title, difficulty: r.difficulty, topics: { name: r.topic_name } },
  }));

  return (
    <ReviewSessionProvider>
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Reviews due</h1>
        <span className="text-sm text-foreground-secondary">{rows.length} problem{rows.length !== 1 ? "s" : ""}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground-secondary">
          No reviews due today. Keep solving problems to build your schedule.
        </p>
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-secondary">
                <th className="px-3 py-2 font-medium">Problem</th>
                <th className="px-3 py-2 font-medium">List</th>
                <th className="px-3 py-2 font-medium">Topic</th>
                <th className="px-3 py-2 font-medium">Difficulty</th>
                <th className="px-3 py-2 font-medium">Due</th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((entry) => {
                const p = entry.problems;
                const isOverdue = entry.due_on < today;
                return (
                  <tr
                    key={`${entry.list_id}-${entry.problem_id}`}
                    className="hover:bg-background-subtle transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <a
                        href={leetcodeUrl(p.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {p.title}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-foreground-secondary">
                      {entry.lists.name}
                    </td>
                    <td className="px-3 py-2.5 text-foreground-secondary">
                      {p.topics?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <DifficultyBadge difficulty={p.difficulty as "easy" | "medium" | "hard"} />
                    </td>
                    <td className={`px-3 py-2.5 ${isOverdue ? "text-warning font-medium" : "text-foreground-secondary"}`}>
                      {isOverdue ? `${daysSince(entry.due_on)}d overdue` : "Today"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ReviewLogButton
                        listId={entry.list_id}
                        problem={{
                          id: entry.problem_id,
                          slug: p.slug,
                          title: p.title,
                          topicName: p.topics?.name ?? "—",
                          difficulty: p.difficulty as "easy" | "medium" | "hard",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </ReviewSessionProvider>
  );
}

function daysSince(dateStr: string) {
  return daysBetween(dateStr, localDay());
}
