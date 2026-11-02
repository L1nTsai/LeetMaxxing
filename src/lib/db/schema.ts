// SQLite schema, applied in order. `PRAGMA user_version` records how many have
// run, so each migration runs exactly once per database file. Append new
// migrations to the end; never edit one that has shipped.
//
// Single-user app: there are no user ids. Per-user state that used to live in
// one row per account (settings, streak) is a single row with id = 1.

export const MIGRATIONS: string[] = [
  /* 1: catalog, progress, attempts, activity, settings */ `
  -- Catalog: filled from catalog.ts on first run.
  create table topics (
    id integer primary key,
    slug text not null unique,
    name text not null unique,
    position integer not null unique check (position > 0)   -- NeetCode roadmap order
  );

  create table problems (
    id integer primary key,
    slug text not null unique,
    title text not null,
    difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
    topic_id integer not null references topics (id)
  );
  create index problems_topic_id_idx on problems (topic_id);

  create table lists (
    id integer primary key,
    slug text not null unique,
    name text not null,
    description text not null,
    position integer not null unique check (position > 0)
  );

  create table list_problems (
    list_id integer not null references lists (id) on delete cascade,
    problem_id integer not null references problems (id),
    position integer not null check (position > 0),
    primary key (list_id, problem_id),
    unique (list_id, position)
  ) without rowid;
  create index list_problems_problem_id_idx on list_problems (problem_id);

  -- Progress and spaced-repetition state for one problem in one list.
  -- No row means the problem hasn't been attempted in that list yet.
  create table list_entries (
    list_id integer not null,
    problem_id integer not null,
    status text not null check (status in ('attempted', 'solved')),
    solved_at text,                                  -- ISO timestamp
    repetitions integer not null default 0 check (repetitions >= 0),
    ease_factor real not null default 2.5 check (ease_factor >= 1.3),
    interval_days integer not null default 0 check (interval_days >= 0),
    due_on text,                                     -- YYYY-MM-DD
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    primary key (list_id, problem_id),
    foreign key (list_id, problem_id)
      references list_problems (list_id, problem_id) on delete cascade,
    check ((status = 'solved') = (solved_at is not null))
  ) without rowid;
  create index list_entries_due_idx on list_entries (due_on);

  -- One row per logged attempt.
  create table attempts (
    id integer primary key,
    list_id integer not null,
    problem_id integer not null,
    rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
    time_minutes integer check (time_minutes is null or time_minutes > 0),
    used_hints integer not null default 0 check (used_hints in (0, 1)),
    viewed_solution integer not null default 0 check (viewed_solution in (0, 1)),
    notes text,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    foreign key (list_id, problem_id)
      references list_problems (list_id, problem_id)
  );
  create index attempts_list_problem_idx on attempts (list_id, problem_id, created_at);

  create table daily_activity (
    day text primary key,                            -- YYYY-MM-DD
    problems_count integer not null default 0 check (problems_count >= 0),
    new_count integer not null default 0 check (new_count >= 0),
    review_count integer not null default 0 check (review_count >= 0),
    goal_met integer not null default 0 check (goal_met in (0, 1)),
    freeze_used integer not null default 0 check (freeze_used in (0, 1))
  ) without rowid;

  create table streak (
    id integer primary key check (id = 1),
    current_streak integer not null default 0 check (current_streak >= 0),
    longest_streak integer not null default 0 check (longest_streak >= 0),
    freezes_available integer not null default 0 check (freezes_available >= 0),
    last_evaluated_day text
  );
  insert into streak (id) values (1);

  create table settings (
    id integer primary key check (id = 1),
    daily_target integer not null default 5 check (daily_target between 1 and 100),
    srs_method text not null default 'sm2'
      check (srs_method in ('sm2', 'leitner', '2357', 'custom')),
    srs_intervals text not null default '[1,3,7,14,30]'
      check (json_valid(srs_intervals) and json_type(srs_intervals) = 'array')
  );
  insert into settings (id) values (1);
  `,

  /* 2: daily reminders */ `
  alter table settings add column reminders_enabled integer not null default 1
    check (reminders_enabled in (0, 1));
  alter table settings add column reminder_time text not null default '20:00'
    check (reminder_time glob '[0-2][0-9]:[0-5][0-9]' and reminder_time <= '23:59');
  alter table settings add column notify_browser integer not null default 1
    check (notify_browser in (0, 1));
  alter table settings add column notify_mac integer not null default 1
    check (notify_mac in (0, 1));

  -- When an open tab last said it can show notifications. While that's recent,
  -- the background macOS job leaves the reminder to the browser.
  create table app_presence (
    id integer primary key check (id = 1),
    browser_seen_at text                              -- ISO timestamp
  );
  insert into app_presence (id) values (1);

  -- One row per reminder sent. The primary key is the claim: whichever sender
  -- inserts first (browser or macOS job) sends it, so it fires once per day.
  create table reminder_log (
    day text not null,                                -- YYYY-MM-DD, local
    kind text not null check (kind in ('daily')),
    channel text not null check (channel in ('browser', 'mac')),
    sent_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    primary key (day, kind)
  ) without rowid;
  `,

  /* 3: several reminder times per day */ `
  create table reminder_times (
    time text primary key                             -- HH:MM, local
      check (time glob '[0-2][0-9]:[0-5][0-9]' and time <= '23:59')
  ) without rowid;
  insert into reminder_times (time) select reminder_time from settings where id = 1;
  alter table settings drop column reminder_time;

  -- The claim is now per time slot: one notification per slot per day.
  drop table reminder_log;
  create table reminder_log (
    day text not null,                                -- YYYY-MM-DD, local
    slot text not null,                               -- HH:MM from reminder_times
    channel text not null check (channel in ('browser', 'mac')),
    sent_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    primary key (day, slot)
  ) without rowid;
  `,

  /* 4: lists imported from LeetCode */ `
  -- Null for the built-in lists; the LeetCode link (or 'leetcode:problems' for
  -- a pasted set of problem links) for lists the user imported.
  alter table lists add column source_url text;
  `,

  /* 5: starred lists are the ones shown on the dashboard */ `
  alter table lists add column starred integer not null default 0
    check (starred in (0, 1));
  -- Keep the dashboard as it was: the built-in lists start starred.
  update lists set starred = 1 where source_url is null;
  `,
];
