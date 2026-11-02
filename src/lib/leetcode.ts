// Reads lists and problems from LeetCode's public GraphQL API (no login).
// Only public lists can be read; private ones come back empty.

import type { Difficulty, TopicSlug } from "./db/catalog.ts";

const ENDPOINT = "https://leetcode.com/graphql";
const MAX_PROBLEMS = 500;

export type LeetCodeProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: TopicSlug;
};

export type LeetCodeList = { name: string; description: string; problems: LeetCodeProblem[] };

export type ParsedInput =
  | { kind: "list"; favoriteSlug: string; url: string }
  | { kind: "problems"; slugs: string[] };

/**
 * Accepts either a list link (leetcode.com/problem-list/<id>/ or
 * leetcode.com/list/<id>) or problem links / slugs, one per line or
 * separated by commas.
 */
export function parseInput(raw: string): ParsedInput | { error: string } {
  const text = raw.trim();
  if (!text) return { error: "Paste a LeetCode list link or some problem links." };

  const list = text.match(/leetcode\.(?:com|cn)\/(?:problem-)?list\/([A-Za-z0-9_-]+)/);
  if (list) return { kind: "list", favoriteSlug: list[1], url: `https://leetcode.com/problem-list/${list[1]}/` };

  const slugs: string[] = [];
  for (const token of text.split(/[\s,]+/).filter(Boolean)) {
    const fromUrl = token.match(/leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)/i);
    const slug = (fromUrl ? fromUrl[1] : token).toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      return { error: `"${token}" isn't a LeetCode list link, problem link or problem slug.` };
    }
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  if (slugs.length > MAX_PROBLEMS) return { error: `A list can have at most ${MAX_PROBLEMS} problems.` };
  return { kind: "problems", slugs };
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", referer: "https://leetcode.com/" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(`Couldn't reach LeetCode (${(err as Error).message}).`);
  }
  if (!res.ok) throw new Error(`LeetCode answered with HTTP ${res.status}. Try again in a minute.`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(`LeetCode error: ${body.errors[0].message}`);
  if (!body.data) throw new Error("LeetCode returned no data.");
  return body.data;
}

type RawQuestion = {
  titleSlug: string;
  title: string;
  difficulty: string;
  topicTags: { slug: string }[];
};

function toProblem(q: RawQuestion): LeetCodeProblem {
  return {
    slug: q.titleSlug,
    title: q.title,
    difficulty: q.difficulty.toLowerCase() as Difficulty,
    topic: topicFor(q.topicTags.map((t) => t.slug)),
  };
}

export async function fetchList(favoriteSlug: string): Promise<LeetCodeList> {
  const detail = await gql<{
    favoriteDetailV2: { name: string; description: string | null } | null;
  }>(
    `query($s: String!) { favoriteDetailV2(favoriteSlug: $s) { name description } }`,
    { s: favoriteSlug },
  );

  const problems: LeetCodeProblem[] = [];
  for (let skip = 0; skip < MAX_PROBLEMS; skip += 100) {
    const page = await gql<{
      favoriteQuestionList: { hasMore: boolean; questions: RawQuestion[] } | null;
    }>(
      `query($s: String!, $skip: Int, $limit: Int) {
        favoriteQuestionList(favoriteSlug: $s, skip: $skip, limit: $limit) {
          hasMore
          questions { titleSlug title difficulty topicTags { slug } }
        }
      }`,
      { s: favoriteSlug, skip, limit: 100 },
    );
    const list = page.favoriteQuestionList;
    if (!list) break;
    // LeetCode currently ignores skip/limit and returns the whole list, so
    // stop as soon as a page adds nothing new.
    const fresh = list.questions.filter((q) => !problems.some((p) => p.slug === q.titleSlug));
    problems.push(...fresh.map(toProblem));
    if (!list.hasMore || fresh.length === 0) break;
  }

  if (problems.length === 0) {
    throw new Error(
      "That list is empty or private. On LeetCode, open the list → … → make it Public, then paste the link again.",
    );
  }
  return {
    name: detail.favoriteDetailV2?.name?.trim() || "LeetCode list",
    description: detail.favoriteDetailV2?.description?.trim() ?? "",
    problems,
  };
}

/** Looks up problems one by one. Throws naming any slug LeetCode doesn't know. */
export async function fetchProblems(slugs: string[]): Promise<LeetCodeProblem[]> {
  const out: (LeetCodeProblem | null)[] = new Array(slugs.length).fill(null);
  const missing: string[] = [];
  let next = 0;
  async function worker() {
    while (next < slugs.length) {
      const i = next++;
      const { question } = await gql<{ question: RawQuestion | null }>(
        `query($s: String!) { question(titleSlug: $s) { titleSlug title difficulty topicTags { slug } } }`,
        { s: slugs[i] },
      );
      if (question) out[i] = toProblem(question);
      else missing.push(slugs[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, slugs.length) }, worker));
  if (missing.length) throw new Error(`LeetCode has no problem called: ${missing.join(", ")}`);
  return out as LeetCodeProblem[];
}

// LeetCode tag → our roadmap topic. First match wins, so more specific
// tags come first (a tree problem is also tagged DFS; a DP problem is
// also tagged array).
const TAG_RULES: [tags: string[], topic: TopicSlug][] = [
  [["trie"], "tries"],
  [["linked-list", "doubly-linked-list"], "linked-list"],
  [["tree", "binary-tree", "binary-search-tree"], "trees"],
  [["union-find", "topological-sort", "shortest-path", "minimum-spanning-tree", "strongly-connected-component", "eulerian-circuit"], "advanced-graphs"],
  [["graph"], "graphs"],
  [["backtracking"], "backtracking"],
  [["heap-priority-queue"], "heap"],
  [["dynamic-programming", "memoization"], "dp-1d"],
  [["binary-search"], "binary-search"],
  [["sliding-window"], "sliding-window"],
  [["stack", "monotonic-stack"], "stack"],
  [["two-pointers"], "two-pointers"],
  [["line-sweep"], "intervals"],
  [["greedy"], "greedy"],
  [["bit-manipulation", "bitmask"], "bit-manipulation"],
  [["depth-first-search", "breadth-first-search"], "graphs"],
  [["math", "geometry", "number-theory", "combinatorics"], "math-geometry"],
];

export function topicFor(tags: string[]): TopicSlug {
  for (const [ruleTags, topic] of TAG_RULES) {
    if (ruleTags.some((t) => tags.includes(t))) {
      // 2-D DP: grid problems.
      if (topic === "dp-1d" && tags.includes("matrix")) return "dp-2d";
      return topic;
    }
  }
  return "arrays-hashing";
}
