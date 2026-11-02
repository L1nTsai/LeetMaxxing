"use client";

import { useActionState, useState } from "react";
import { saveSettings } from "./actions";
import { Button } from "@/components/ui";
import type { SrsMethod } from "@/lib/srs";

type Props = {
  method: SrsMethod;
  intervals: number[];
  leitnerIntervals: number[];
  intervals2357: number[];
  methods: Record<SrsMethod, { label: string; description: string; presetIntervals?: number[] }>;
};

export default function SrsForm({ method: savedMethod, intervals: savedIntervals, leitnerIntervals, intervals2357, methods }: Props) {
  const [selected, setSelected] = useState<SrsMethod>(savedMethod);
  const [customStr, setCustomStr] = useState(
    savedMethod === "custom" ? savedIntervals.join(", ") : "1, 3, 7, 14, 30"
  );
  const [state, formAction, pending] = useActionState(saveSettings, null);

  const previewIntervals =
    selected === "leitner" ? leitnerIntervals
    : selected === "2357"  ? intervals2357
    : selected === "custom"
      ? customStr.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => n > 0)
      : null;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="srs_intervals" value={selected === "custom" ? customStr : (previewIntervals ?? []).join(",")} />

      <div className="space-y-2">
        {(Object.entries(methods) as [SrsMethod, typeof methods[SrsMethod]][]).map(([key, info]) => (
          <label key={key} className="flex gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-border-strong transition-colors has-[:checked]:border-foreground has-[:checked]:bg-background-subtle">
            <input
              type="radio"
              name="srs_method"
              value={key}
              checked={selected === key}
              onChange={() => setSelected(key)}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{info.label}</p>
              <p className="text-xs text-foreground-secondary mt-0.5">{info.description}</p>
              {info.presetIntervals && selected === key && (
                <p className="text-xs text-foreground-tertiary mt-1.5 font-mono">
                  {info.presetIntervals.map((d, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 text-border-strong">→</span>}
                      {d}d
                    </span>
                  ))}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {selected === "custom" && (
        <div>
          <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
            Intervals (days, comma-separated)
          </label>
          <input
            type="text"
            value={customStr}
            onChange={(e) => setCustomStr(e.target.value)}
            placeholder="e.g. 1, 3, 7, 14, 30, 60"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono focus:border-border-strong focus:outline-none"
          />
          {previewIntervals && previewIntervals.length > 0 && (
            <p className="text-xs text-foreground-tertiary mt-1.5 font-mono">
              {previewIntervals.map((d, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1 text-border-strong">→</span>}
                  {d}d
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {state && !state.success && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-success">Saved.</p>
      )}

      <Button type="submit" disabled={pending} className="h-8 px-4 text-xs">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
