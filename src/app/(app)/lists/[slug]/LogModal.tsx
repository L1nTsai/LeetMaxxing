"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logAttempt } from "./log/[problemSlug]/actions";
import type { LoggedAttempt } from "./log/[problemSlug]/actions";
import { Button, DifficultyBadge } from "@/components/ui";
import { leetcodeUrl } from "@/lib/constants";
import type { ProblemRow } from "./ListViews";
import TimeDial, { formatMinutes } from "./TimeDial";
import AttemptHistory from "./AttemptHistory";
import TimerFace from "./TimerFace";
import { useSolveSession, formatClock, elapsedToMinutes } from "./useSolveSession";

/**
 * "session": start / run / stop a timer with notes alongside.
 * "log": rate the attempt and adjust time and notes.
 * "notes": read-only past attempts.
 * After a successful log the window shows a summary of what was saved.
 */
export type LogModalMode = "session" | "log" | "notes";

type Props = {
  problem: Pick<ProblemRow, "id" | "slug" | "title" | "topicName" | "difficulty">;
  listId: number;
  initialMode?: LogModalMode;
  onClose: () => void;
};

const RATINGS = [
  { value: "again", label: "Again", desc: "Completely forgot" },
  { value: "hard",  label: "Hard",  desc: "Struggled a lot" },
  { value: "good",  label: "Good",  desc: "Got it with effort" },
  { value: "easy",  label: "Easy",  desc: "Solved cleanly" },
] as const;

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus:border-border-strong focus:outline-none resize-none";
const labelClass = "text-xs font-medium text-foreground-secondary block mb-2";

export default function LogModal({ problem, listId, initialMode = "session", onClose }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const session = useSolveSession(listId, problem.id);
  const [mode, setMode] = useState<LogModalMode>(initialMode);
  const [minutes, setMinutes] = useState(0);
  const [state, formAction, pending] = useActionState(logAttempt, null);
  const logged = state?.success ? state.logged : null;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Saved: the session is done, and the list behind the window needs fresh status.
  const { clear } = session;
  useEffect(() => {
    if (state?.success) {
      clear();
      router.refresh();
    }
  }, [state, clear, router]);

  const onDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const goToLog = () => {
    session.stop();
    setMinutes(session.elapsedMs > 0 ? elapsedToMinutes(session.elapsedMs) : 0);
    setMode("log");
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={onDialogClick}
      onCancel={onClose}
      className="m-auto rounded-xl border border-border bg-background text-left text-foreground p-0 backdrop:bg-black/50 w-[calc(100%-2rem)] max-w-3xl"
      style={{ padding: 0 }}
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-foreground-secondary mb-1">{problem.topicName}</p>
            <h2 className="font-semibold text-sm leading-snug">{problem.title}</h2>
            <a
              href={leetcodeUrl(problem.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-accent hover:underline"
            >
              Open on LeetCode ↗
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DifficultyBadge difficulty={problem.difficulty} />
            <button
              onClick={onClose}
              className="text-foreground-tertiary hover:text-foreground transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {logged ? (
          <SummaryStage logged={logged} listId={listId} problemId={problem.id} onClose={onClose} />
        ) : mode === "notes" ? (
          <NotesStage listId={listId} problemId={problem.id} onClose={onClose} onStart={() => setMode("session")} />
        ) : mode === "session" ? (
          <SessionStage session={session} title={problem.title} onSubmit={goToLog} onClose={onClose} />
        ) : (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="listId" value={listId} />
            <input type="hidden" name="problemId" value={problem.id} />

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* Left column */}
              <div className="space-y-5">
                <fieldset>
                  <legend className="text-xs font-medium text-foreground-secondary mb-2">How did it go?</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {RATINGS.map(({ value, label, desc }) => (
                      <label key={value} className="cursor-pointer">
                        <input type="radio" name="rating" value={value} required className="sr-only peer" defaultChecked={value === "good"} />
                        <div className="h-full border border-border rounded-lg p-2 text-center transition-colors hover:border-border-strong peer-checked:border-foreground peer-checked:bg-muted peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                          <p className="text-xs font-semibold text-foreground">{label}</p>
                          <p className="text-[10px] text-foreground-secondary mt-0.5 leading-tight">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="time_minutes" className={labelClass}>Time spent</label>
                  <div className="flex flex-col items-center gap-3">
                    <TimeDial value={minutes} onChange={setMinutes} max={300} />
                    <div className="flex items-center gap-2">
                      <input
                        id="time_minutes"
                        type="number"
                        name="time_minutes"
                        min={0}
                        max={300}
                        placeholder="0"
                        value={minutes || ""}
                        onChange={(e) => {
                          const n = Math.round(Number(e.target.value));
                          setMinutes(Number.isFinite(n) ? Math.max(0, Math.min(300, n)) : 0);
                        }}
                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums text-foreground placeholder:text-foreground-tertiary focus:border-border-strong focus:outline-none"
                      />
                      <span className="text-xs text-foreground-secondary">minutes</span>
                    </div>
                    {session.elapsedMs > 0 && (
                      <p className="text-[11px] text-foreground-tertiary">Timer: {formatClock(session.elapsedMs)}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-foreground-secondary cursor-pointer">
                    <input type="checkbox" name="used_hints" value="true" className="rounded border-border" />
                    Used hints
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground-secondary cursor-pointer">
                    <input type="checkbox" name="viewed_solution" value="true" className="rounded border-border" />
                    Viewed solution
                  </label>
                </div>
              </div>

              {/* Right column: notes */}
              <div className="flex min-h-0 flex-col gap-5">
                <div>
                  <label htmlFor="notes" className={labelClass}>Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={6}
                    value={session.notes}
                    onChange={(e) => session.setNotes(e.target.value)}
                    placeholder="Key insight, edge case, pattern…"
                    className={fieldClass}
                  />
                </div>
                <div className="flex min-h-0 flex-col">
                  <h3 className="text-xs font-medium text-foreground-secondary mb-2">Previous attempts</h3>
                  <div className="max-h-56 overflow-y-auto">
                    <AttemptHistory listId={listId} problemId={problem.id} />
                  </div>
                </div>
              </div>
            </div>

            {state && !state.success && <p className="text-xs text-danger">{state.error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="secondary" onClick={() => setMode("session")} className="h-8 px-3 text-xs">
                Back to timer
              </Button>
              <Button type="submit" disabled={pending} className="h-8 px-3 text-xs">
                {pending ? "Saving…" : "Log attempt"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

// ── Session: timer + notes ────────────────────────────────────────────────────

function SessionStage({
  session,
  title,
  onSubmit,
  onClose,
}: {
  session: ReturnType<typeof useSolveSession>;
  title: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const { status, elapsedMs } = session;
  // "Fullscreen" here means filling the browser window, not the browser's fullscreen mode.
  const [expanded, setExpanded] = useState(false);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="font-mono text-5xl font-semibold tabular-nums text-foreground-tertiary">00:00</p>
        <Button onClick={session.start} className="h-10 px-6">Start timer</Button>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={onSubmit} className="text-foreground-secondary hover:text-foreground transition-colors">
            Skip timer and log
          </button>
          <span className="text-border-strong">·</span>
          <button type="button" onClick={onClose} className="text-foreground-secondary hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const running = status === "running";
  const btn = expanded ? "h-11 px-6 text-base" : "h-9 px-4";

  return (
    <div
      // Esc shrinks back first instead of closing the whole window.
      onKeyDown={(e) => {
        if (expanded && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setExpanded(false); }
      }}
      className={expanded ? "fixed inset-0 z-50 flex flex-col gap-6 overflow-y-auto bg-background p-6 text-foreground md:p-10" : "space-y-5"}
    >
      {/* The window header isn't visible when expanded, so show the title here. */}
      {expanded && <h2 className="truncate text-lg font-semibold">{title}</h2>}

      <div
        className={`grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${expanded ? "min-h-0 flex-1 md:gap-10" : ""}`}
      >
        {/* Timer */}
        <div
          className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-border ${expanded ? "gap-6 py-6" : "py-10"}`}
        >
          <TimerFace elapsedMs={elapsedMs} running={running} large={expanded} />
          <p className={`${expanded ? "text-sm" : "text-xs"} text-foreground-tertiary`}>
            {running ? "Timer running" : "Timer stopped"} · click the clock to switch view
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={session.restart} className={btn} title="Back to 0:00 and start again">
              Restart
            </Button>
            {running ? (
              <Button variant="secondary" onClick={session.stop} className={btn}>Stop</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={session.resume} className={btn}>Resume</Button>
                <Button onClick={onSubmit} className={btn}>Submit</Button>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className={`flex flex-col ${expanded ? "min-h-0" : ""}`}>
          <label htmlFor="session_notes" className={labelClass}>Notes</label>
          <textarea
            id="session_notes"
            value={session.notes}
            onChange={(e) => session.setNotes(e.target.value)}
            placeholder="Approach, edge cases, where you got stuck…"
            className={`${fieldClass} flex-1 ${expanded ? "min-h-0 p-4 text-base leading-relaxed" : "min-h-48"}`}
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={`${expanded ? "text-xs" : "text-[11px]"} text-foreground-tertiary`}>
          {expanded
            ? "Esc to shrink back. The timer and notes are kept until you submit."
            : "You can close this window; the timer and notes are kept until you submit."}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground-secondary transition-colors hover:bg-background-subtle hover:text-foreground"
          aria-label={expanded ? "Exit fullscreen" : "Fullscreen timer and notes"}
          aria-pressed={expanded}
        >
          <FullscreenIcon exit={expanded} />
          {expanded ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {exit ? (
        <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />
      ) : (
        <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
      )}
    </svg>
  );
}

// ── Read-only notes ───────────────────────────────────────────────────────────

function NotesStage({
  listId, problemId, onClose, onStart,
}: { listId: number; problemId: number; onClose: () => void; onStart: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-medium text-foreground-secondary">Notes &amp; past attempts</h3>
      <div className="max-h-[60vh] overflow-y-auto">
        <AttemptHistory listId={listId} problemId={problemId} />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="h-8 px-3 text-xs">Close</Button>
        <Button type="button" onClick={onStart} className="h-8 px-3 text-xs">Review</Button>
      </div>
    </div>
  );
}

// ── After logging ─────────────────────────────────────────────────────────────

const RATING_LABEL = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" } as const;

function SummaryStage({
  logged, listId, problemId, onClose,
}: { logged: LoggedAttempt; listId: number; problemId: number; onClose: () => void }) {
  const flags = [logged.usedHints && "Used hints", logged.viewedSolution && "Viewed solution"].filter(Boolean);
  const due = logged.dueOn
    ? new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" })
        .format(new Date(`${logged.dueOn}T00:00:00`))
    : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* What was just saved */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-success">
            {logged.isReview ? "Review logged" : "Attempt logged"}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-foreground-secondary">Rating</dt>
            <dd className="font-medium">{RATING_LABEL[logged.rating]}</dd>
            <dt className="text-foreground-secondary">Time</dt>
            <dd className="tabular-nums">{logged.timeMinutes ? formatMinutes(logged.timeMinutes) : "—"}</dd>
            <dt className="text-foreground-secondary">Help</dt>
            <dd>{flags.length ? flags.join(", ") : "None"}</dd>
            <dt className="text-foreground-secondary">Status</dt>
            <dd className="capitalize">{logged.status}</dd>
            <dt className="text-foreground-secondary">Next review</dt>
            <dd>
              {due ? (
                <>
                  {due}{" "}
                  <span className="text-foreground-tertiary">
                    ({logged.intervalDays === 0 ? "today" : `in ${logged.intervalDays} day${logged.intervalDays === 1 ? "" : "s"}`})
                  </span>
                </>
              ) : "—"}
            </dd>
          </dl>
          <div>
            <p className={labelClass}>Notes</p>
            {logged.notes ? (
              <p className="whitespace-pre-wrap break-words rounded-md border border-border p-3 text-sm">{logged.notes}</p>
            ) : (
              <p className="text-xs italic text-foreground-tertiary">No notes</p>
            )}
          </div>
        </div>

        {/* Everything logged for this problem, including the new one */}
        <div className="flex min-h-0 flex-col">
          <h3 className="text-xs font-medium text-foreground-secondary mb-2">All attempts</h3>
          <div className="max-h-80 overflow-y-auto">
            <AttemptHistory listId={listId} problemId={problemId} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose} className="h-8 px-4 text-xs">Done</Button>
      </div>
    </div>
  );
}
