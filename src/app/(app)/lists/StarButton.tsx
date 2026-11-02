"use client";

import { useOptimistic, useTransition } from "react";
import { setListStarred } from "./actions";

/** Toggles whether a list is pinned to the dashboard. */
export default function StarButton({ listId, name, starred }: { listId: number; name: string; starred: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(starred);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? `Remove ${name} from dashboard` : `Show ${name} on dashboard`}
      title={optimistic ? "Shown on dashboard" : "Star to show on dashboard"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setListStarred(listId, !optimistic);
        })
      }
      className={`rounded-md p-1.5 transition-colors hover:bg-muted ${
        optimistic ? "text-warning" : "text-foreground-tertiary hover:text-foreground"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={optimistic ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
      </svg>
    </button>
  );
}
