import { LISTS, PROBLEMS, TOPICS } from "./catalog.ts";

/** Consistency checks for catalog.ts. Returns a list of problems found. */
export function validateCatalog(): string[] {
  const errors: string[] = [];
  const topicSlugs = new Set<string>(TOPICS.map((t) => t.slug));

  const problemSlugs = new Set<string>();
  for (const p of PROBLEMS) {
    if (problemSlugs.has(p.slug)) errors.push(`duplicate problem: ${p.slug}`);
    problemSlugs.add(p.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) errors.push(`bad slug: ${p.slug}`);
    if (!topicSlugs.has(p.topic)) errors.push(`${p.slug}: unknown topic ${p.topic}`);
  }

  const used = new Set<string>();
  for (const list of LISTS) {
    if (list.problems.length !== list.size) {
      errors.push(`${list.slug}: expected ${list.size} problems, found ${list.problems.length}`);
    }
    const seen = new Set<string>();
    for (const slug of list.problems) {
      if (seen.has(slug)) errors.push(`${list.slug}: ${slug} appears twice`);
      if (!problemSlugs.has(slug)) errors.push(`${list.slug}: unknown problem ${slug}`);
      seen.add(slug);
      used.add(slug);
    }
  }

  for (const slug of problemSlugs) {
    if (!used.has(slug)) errors.push(`problem not in any list: ${slug}`);
  }
  return errors;
}
