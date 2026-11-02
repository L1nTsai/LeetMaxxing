"use client";

import { useState, useTransition } from "react";
import { deleteList } from "./actions";

/** Two-step delete (no browser confirm dialog): click, then confirm. */
export default function DeleteListButton({ listId, name }: { listId: number; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-foreground-tertiary hover:text-danger transition-colors"
        aria-label={`Delete ${name}`}
      >
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-foreground-secondary">Delete list and its progress?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteList(listId))}
        className="font-medium text-danger disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-foreground-secondary">
        Cancel
      </button>
    </span>
  );
}
