"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updateDailyTarget } from "../settings/actions";
import { Button } from "@/components/ui";
import FlipCard, { useFlipClose } from "@/components/FlipCard";

const MIN = 1;
const MAX = 100;

/** The "Today's goal" card: clicking it flips open a window to change the daily target. */
export default function GoalCard({ target, children }: { target: number; children: ReactNode }) {
  return (
    <FlipCard
      title="Daily goal"
      label={`Today's goal, target ${target}. Click to change.`}
      panel={<GoalForm target={target} />}
      panelWidth="max-w-sm"
      data-tour="goal"
    >
      {children}
    </FlipCard>
  );
}

function GoalForm({ target }: { target: number }) {
  const router = useRouter();
  const close = useFlipClose();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(String(target));
  const [state, formAction, pending] = useActionState(updateDailyTarget, null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      close();
    }
  }, [state, router, close]);

  const value = Number(draft);
  const valid = Number.isInteger(value) && value >= MIN && value <= MAX;
  const step = (delta: number) => {
    const base = Number.isFinite(value) ? value : target;
    setDraft(String(Math.min(MAX, Math.max(MIN, Math.round(base) + delta))));
  };

  return (
    <form action={formAction} className="space-y-5">
      <p className="-mt-3 text-xs text-foreground-secondary">
        Problems to solve or review each day. Both count toward your streak.
      </p>

      <div className="flex items-center justify-center gap-3">
        <StepButton label="Decrease" onClick={() => step(-1)} disabled={value <= MIN}>−</StepButton>
        <input
          ref={inputRef}
          type="number"
          name="daily_target"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          min={MIN}
          max={MAX}
          required
          aria-label="Problems per day"
          className="h-14 w-24 rounded-md border border-border bg-background text-center text-3xl font-bold tabular-nums focus:border-border-strong focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <StepButton label="Increase" onClick={() => step(1)} disabled={value >= MAX}>+</StepButton>
      </div>
      <p className="-mt-2 text-center text-xs text-foreground-tertiary">problems per day</p>

      {state && !state.success && <p className="text-xs text-danger">{state.error}</p>}
      {!valid && draft !== "" && (
        <p className="text-xs text-danger">Goal must be a whole number from {MIN} to {MAX}.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" disabled={pending || !valid || value === target}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="h-10 w-10 rounded-full border border-border text-lg text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
