import Link from "next/link";
import { getDb } from "@/lib/db";
import { ProgressBar } from "@/components/ui";
import ImportListForm from "./ImportListForm";
import DeleteListButton from "./DeleteListButton";
import StarButton from "./StarButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lists" };

type ListRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  source_url: string | null;
  starred: 0 | 1;
  total: number;
  solved: number;
};

function ListItem({ list }: { list: ListRow }) {
  const { total, solved } = list;
  const imported = list.source_url !== null;
  const leetcodeUrl = list.source_url?.startsWith("https://") ? list.source_url : null;
  return (
    <div className="relative flex flex-col">
      <Link
        href={`/lists/${list.slug}`}
        className="flex flex-col gap-3 py-4 pl-5 pr-14 hover:bg-background-subtle transition-colors"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{list.name}</span>
          <span className="shrink-0 text-sm text-foreground-secondary">
            {solved} / {total}
          </span>
        </div>
        <ProgressBar value={solved} max={total} />
        <p className="text-sm text-foreground-secondary">{list.description}</p>
      </Link>
      <div className="absolute right-3 top-3">
        <StarButton listId={list.id} name={list.name} starred={list.starred === 1} />
      </div>
      {imported && (
        <div className="flex items-center justify-between gap-4 px-5 pb-3 -mt-1">
          {leetcodeUrl ? (
            <a
              href={leetcodeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-foreground-tertiary hover:text-foreground transition-colors"
            >
              View on LeetCode ↗
            </a>
          ) : (
            <span className="text-xs text-foreground-tertiary">From LeetCode problems</span>
          )}
          <DeleteListButton listId={list.id} name={list.name} />
        </div>
      )}
    </div>
  );
}

export default async function ListsPage() {
  const db = await getDb();
  const lists = db.prepare(`
    select l.id, l.slug, l.name, l.description, l.source_url, l.starred,
           (select count(*) from list_problems lp where lp.list_id = l.id) as total,
           (select count(*) from list_entries e where e.list_id = l.id and e.status = 'solved') as solved
    from lists l
    order by l.position
  `).all() as ListRow[];

  const curated = lists.filter((l) => l.source_url === null);
  const mine = lists.filter((l) => l.source_url !== null);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Lists</h1>
        <p className="text-sm text-foreground-secondary">Star a list to show it on your dashboard.</p>
      </div>

      <h2 className="mb-3 text-sm font-medium text-foreground-secondary">Your lists</h2>
      {mine.length > 0 && (
        <div className="mb-4 flex flex-col divide-y divide-border rounded-lg border border-border">
          {mine.map((list) => <ListItem key={list.id} list={list} />)}
        </div>
      )}
      <div className="mb-10">
        <ImportListForm />
      </div>

      <h2 className="mb-3 text-sm font-medium text-foreground-secondary">Curated</h2>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {curated.map((list) => <ListItem key={list.id} list={list} />)}
      </div>
    </div>
  );
}
