"use client";

import { useEffect, useState } from "react";
import { getAttempts } from "./log/[problemSlug]/actions";
import type { Attempt } from "./log/[problemSlug]/actions";
import { formatMinutes, RATING_LABEL, RATING_STYLE } from "@/lib/attempts";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; attempts: Attempt[] };

/** Past attempts (newest first) for one problem in one list, with their notes. */
export default function AttemptHistory({ listId, problemId }: { listId: number; problemId: number }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getAttempts(listId, problemId).then(
      (attempts) => { if (!cancelled) setState({ status: "ready", attempts }); },
      (err: unknown) => {
        if (!cancelled) setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
      },
    );
    return () => { cancelled = true; };
  }, [listId, problemId]);

  if (state.status === "loading") {
    return <p className="text-xs text-foreground-tertiary">Loading…</p>;
  }
  if (state.status === "error") {
    return <p className="text-xs text-danger">Couldn’t load attempts: {state.message}</p>;
  }
  if (state.attempts.length === 0) {
    return <p className="text-xs text-foreground-tertiary">No attempts logged yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {state.attempts.map((a) => {
        const meta = [
          a.time_minutes ? formatMinutes(a.time_minutes) : null,
          a.used_hints ? "hints" : null,
          a.viewed_solution ? "solution" : null,
        ].filter(Boolean);
        return (
          <li key={a.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`inline-flex h-5 items-center rounded-full px-2 font-medium ${RATING_STYLE[a.rating]}`}>
                {RATING_LABEL[a.rating]}
              </span>
              <span className="text-foreground-secondary tabular-nums">{dateFmt.format(new Date(a.created_at))}</span>
              {meta.length > 0 && (
                <span className="ml-auto text-foreground-tertiary">{meta.join(" · ")}</span>
              )}
            </div>
            {a.notes ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{a.notes}</p>
            ) : (
              <p className="mt-2 text-xs italic text-foreground-tertiary">No notes</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
