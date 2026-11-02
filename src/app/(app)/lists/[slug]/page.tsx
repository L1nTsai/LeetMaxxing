import { notFound } from "next/navigation";
import { localDay } from "@/lib/day";
import { getDb } from "@/lib/db";
import ListViews from "./ListViews";
import type { ProblemRow, TopicSlug } from "./ListViews";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

type Row = {
  id: number;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topic_slug: TopicSlug;
  topic_name: string;
  position: number;
  status: "attempted" | "solved" | null;
  due_on: string | null;
  has_notes: 0 | 1;
};

export default async function ListPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const today = localDay();

  const list = db.prepare("select id, slug, name from lists where slug = ?").get(slug) as
    | { id: number; slug: string; name: string }
    | undefined;
  if (!list) notFound();

  const rows = db.prepare(`
    select p.id, p.slug, p.title, p.difficulty,
           t.slug as topic_slug, t.name as topic_name,
           lp.position, e.status, e.due_on,
           exists (
             select 1 from attempts a
             where a.list_id = lp.list_id and a.problem_id = p.id and a.notes is not null
           ) as has_notes
    from list_problems lp
    join problems p on p.id = lp.problem_id
    join topics t on t.id = p.topic_id
    left join list_entries e on e.list_id = lp.list_id and e.problem_id = p.id
    where lp.list_id = ?
    order by lp.position
  `).all(list.id) as Row[];

  const problems: ProblemRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    difficulty: r.difficulty,
    topicSlug: r.topic_slug,
    topicName: r.topic_name,
    status: r.status,
    dueOn: r.due_on,
    position: r.position,
    hasNotes: r.has_notes === 1,
  }));

  return <ListViews listId={list.id} listName={list.name} problems={problems} today={today} />;
}
