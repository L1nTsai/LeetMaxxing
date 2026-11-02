"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Button } from "@/components/ui";
import LogModal from "../lists/[slug]/LogModal";
import type { ComponentProps, ReactNode } from "react";

type Target = Pick<ComponentProps<typeof LogModal>, "listId" | "problem">;

const OpenReview = createContext<(t: Target) => void>(() => {});

/**
 * Owns the review window for the whole page. It sits above the table because
 * logging a review refreshes the page and removes that row from the due list;
 * the window (and its summary) must outlive the row.
 */
export function ReviewSessionProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  const close = useCallback(() => setTarget(null), []);
  return (
    <OpenReview.Provider value={setTarget}>
      {children}
      {target && (
        <LogModal
          key={`${target.listId}-${target.problem.id}`}
          listId={target.listId}
          problem={target.problem}
          onClose={close}
        />
      )}
    </OpenReview.Provider>
  );
}

/** "Review" for a due problem: opens the timer → log → summary flow. */
export default function ReviewLogButton(target: Target) {
  const open = useContext(OpenReview);
  return (
    <Button variant="secondary" onClick={() => open(target)} className="h-7 px-2 text-xs">
      Review
    </Button>
  );
}
