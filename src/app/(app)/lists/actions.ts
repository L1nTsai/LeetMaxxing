"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { fetchList, fetchProblems, parseInput, type LeetCodeProblem } from "@/lib/leetcode";

export type ImportResult = { error: string } | null;

function slugify(name: string) {
  return (
    name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    "my-list"
  );
}

export async function importList(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const parsed = parseInput(String(formData.get("source") ?? ""));
  if ("error" in parsed) return { error: parsed.error };
  const nameInput = String(formData.get("name") ?? "").trim().slice(0, 100);

  let name: string;
  let description: string;
  let problems: LeetCodeProblem[];
  let sourceUrl: string;
  try {
    if (parsed.kind === "list") {
      const list = await fetchList(parsed.favoriteSlug);
      ({ name, description, problems } = list);
      sourceUrl = parsed.url;
    } else {
      problems = await fetchProblems(parsed.slugs);
      name = "My list";
      description = "";
      sourceUrl = "leetcode:problems";
    }
  } catch (err) {
    return { error: (err as Error).message };
  }
  name = nameInput || name;
  description ||= `${problems.length} problems imported from LeetCode.`;

  const conn = db();
  if (parsed.kind === "list") {
    const existing = conn.prepare("select slug from lists where source_url = ?").get(sourceUrl) as
      | { slug: string }
      | undefined;
    if (existing) return { error: "You've already imported this list. Delete it first to import it again." };
  }

  const slug = conn.transaction(() => {
    // Unique slug: my-list, my-list-2, ...
    const base = slugify(name);
    let slug = base;
    for (let n = 2; conn.prepare("select 1 from lists where slug = ?").get(slug); n++) slug = `${base}-${n}`;

    const { pos } = conn.prepare("select coalesce(max(position), 0) + 1 as pos from lists").get() as { pos: number };
    // Imported lists start starred, so they show on the dashboard.
    const listId = conn
      .prepare("insert into lists (slug, name, description, position, source_url, starred) values (?, ?, ?, ?, ?, 1)")
      .run(slug, name, description, pos, sourceUrl).lastInsertRowid;

    // Problems already in the catalog keep their curated topic.
    const addProblem = conn.prepare(`
      insert into problems (slug, title, difficulty, topic_id)
      values (?, ?, ?, (select id from topics where slug = ?))
      on conflict (slug) do nothing`);
    const addToList = conn.prepare(`
      insert into list_problems (list_id, problem_id, position)
      values (?, (select id from problems where slug = ?), ?)`);
    const seen = new Set<string>();
    let position = 0;
    for (const p of problems) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      addProblem.run(p.slug, p.title, p.difficulty, p.topic);
      addToList.run(listId, p.slug, ++position);
    }
    return slug;
  })();

  revalidatePath("/lists");
  revalidatePath("/dashboard");
  redirect(`/lists/${slug}`);
}

/** Stars or unstars a list. Starred lists are the ones shown on the dashboard. */
export async function setListStarred(listId: number, starred: boolean): Promise<void> {
  db().prepare("update lists set starred = ? where id = ?").run(starred ? 1 : 0, listId);
  revalidatePath("/lists");
  revalidatePath("/dashboard");
}

/** Deletes an imported list and its progress. Built-in lists can't be deleted. */
export async function deleteList(listId: number): Promise<void> {
  const conn = db();
  conn.transaction(() => {
    const list = conn.prepare("select source_url from lists where id = ?").get(listId) as
      | { source_url: string | null }
      | undefined;
    if (!list || list.source_url === null) return;
    // attempts reference list_problems without cascade; list_entries and
    // list_problems cascade from the list.
    conn.prepare("delete from attempts where list_id = ?").run(listId);
    conn.prepare("delete from lists where id = ?").run(listId);
  })();
  revalidatePath("/lists");
  revalidatePath("/reviews");
  revalidatePath("/dashboard");
}
