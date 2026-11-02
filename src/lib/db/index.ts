import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { MIGRATIONS } from "./schema.ts";
import { LISTS, PROBLEMS, TOPICS } from "./catalog.ts";
import { validateCatalog } from "./validate-catalog.ts";

export type DB = Database.Database;

/** Where the database lives. Override with LEETMAXXING_DB_PATH. */
export const DB_PATH =
  process.env.LEETMAXXING_DB_PATH ?? path.join(process.cwd(), "data", "leetmaxxing.db");

// Reuse one connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __leetmaxxingDb?: DB };

function open(): DB {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  seedCatalog(db);
  return db;
}

function migrate(db: DB) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

/** Loads catalog.ts into an empty database. Later catalog edits need a migration. */
function seedCatalog(db: DB) {
  const { n } = db.prepare("select count(*) as n from topics").get() as { n: number };
  if (n > 0) return;

  const errors = validateCatalog();
  if (errors.length) throw new Error(`Invalid catalog:\n${errors.join("\n")}`);

  db.transaction(() => {
    const topic = db.prepare("insert into topics (slug, name, position) values (?, ?, ?)");
    TOPICS.forEach((t, i) => topic.run(t.slug, t.name, i + 1));

    const problem = db.prepare(`
      insert into problems (slug, title, difficulty, topic_id)
      values (?, ?, ?, (select id from topics where slug = ?))`);
    for (const p of PROBLEMS) problem.run(p.slug, p.title, p.difficulty, p.topic);

    // Built-in lists start starred, so they show on the dashboard.
    const list = db.prepare(
      "insert into lists (slug, name, description, position, starred) values (?, ?, ?, ?, 1)",
    );
    const listProblem = db.prepare(`
      insert into list_problems (list_id, problem_id, position)
      values (?, (select id from problems where slug = ?), ?)`);
    LISTS.forEach((l, i) => {
      const listId = list.run(l.slug, l.name, l.description, i + 1).lastInsertRowid;
      l.problems.forEach((slug, j) => listProblem.run(listId, slug, j + 1));
    });
  })();
}

/** The database, for server actions and route handlers. */
export function db(): DB {
  const cached = globalForDb.__leetmaxxingDb;
  if (!cached) return (globalForDb.__leetmaxxingDb = open());
  // A connection kept across hot reloads misses migrations added since it opened.
  if ((cached.pragma("user_version", { simple: true }) as number) < MIGRATIONS.length) migrate(cached);
  return cached;
}

/**
 * The database, for Server Components. better-sqlite3 is synchronous, so
 * without `connection()` Next would run the query once at build time and
 * serve that result forever. Callers render inside a Suspense boundary
 * (the (app) route group's loading.tsx).
 */
export async function getDb(): Promise<DB> {
  await connection();
  return db();
}
