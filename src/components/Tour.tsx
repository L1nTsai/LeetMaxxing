"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui";

export type TourStep = {
  /** Matches an element's `data-tour` attribute. Omit for a centered step. */
  target?: string;
  title: string;
  body: string;
  /** Optional call-to-action link shown on this step. */
  cta?: { href: string; label: string };
};

export const TOUR_STORAGE_KEY = "leetmaxxing:tour-completed";
export const TOUR_START_EVENT = "leetmaxxing:start-tour";
/** Fired on window when the tour closes (finished or skipped). */
export const TOUR_END_EVENT = "leetmaxxing:tour-ended";

const PAD = 6; // space between the highlighted element and the ring
const CARD_WIDTH = 320;
const CARD_GAP = 12;

type Rect = { top: number; left: number; width: number; height: number };

function readCompleted() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCompleted() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    // Storage unavailable (private mode etc.) — the tour just shows again next time.
  }
}

export default function Tour({ steps }: { steps: TourStep[] }) {
  const [index, setIndex] = useState<number | null>(null);
  // The measured rect is tagged with its step so a stale one is never shown.
  const [measured, setMeasured] = useState<{ index: number; rect: Rect } | null>(null);

  const step = index === null ? null : steps[index];
  const rect = measured && measured.index === index ? measured.rect : null;

  const finish = useCallback(() => {
    writeCompleted();
    setIndex(null);
    window.dispatchEvent(new Event(TOUR_END_EVENT));
  }, []);

  // Auto-start on first visit, or when sent here with ?tour=1. Also listen for
  // the header's "Tour" button.
  useEffect(() => {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("tour") === "1";
    if (requested) {
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    const start = () => setIndex(0);
    // Start after first paint so the page is laid out before we measure it.
    const timer = requested || !readCompleted() ? setTimeout(start, 300) : undefined;

    window.addEventListener(TOUR_START_EVENT, start);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(TOUR_START_EVENT, start);
    };
  }, []);

  // Measure the target element and keep the highlight in sync with scroll/resize.
  useLayoutEffect(() => {
    if (index === null || !step?.target) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return; // Target missing: the step falls back to a centered card.
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setMeasured({ index, rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, step]);

  // Keyboard: ← → to move, Esc to skip.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") setIndex((i) => (i !== null && i < steps.length - 1 ? i + 1 : i));
      else if (e.key === "ArrowLeft") setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, steps.length, finish]);

  if (index === null || !step) return null;

  const isLast = index === steps.length - 1;

  // Place the card below the target when there's room, otherwise above.
  let cardStyle: React.CSSProperties;
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(16, rect.left), vw - CARD_WIDTH - 16);
    const spaceBelow = vh - (rect.top + rect.height + PAD);
    cardStyle =
      spaceBelow > 220
        ? { left, top: rect.top + rect.height + PAD + CARD_GAP }
        : { left, bottom: vh - rect.top + PAD + CARD_GAP };
  } else {
    cardStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    // No backdrop: the page stays visible and clickable; only the card takes input.
    <div className="pointer-events-none fixed inset-0 z-50" role="dialog" aria-labelledby="tour-title">
      {rect && (
        // Outline around the target.
        <div
          className="fixed rounded-lg border-2 border-accent transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        className="pointer-events-auto fixed rounded-lg border border-border-strong bg-background p-4"
        style={{ width: CARD_WIDTH, maxWidth: "calc(100vw - 32px)", ...cardStyle }}
      >
        <p className="mb-1 text-xs tabular-nums text-foreground-tertiary">
          {index + 1} of {steps.length}
        </p>
        <h2 id="tour-title" className="mb-1.5 text-sm font-semibold">{step.title}</h2>
        <p className="text-sm leading-relaxed text-foreground-secondary">{step.body}</p>

        {step.cta && (
          <Link href={step.cta.href} onClick={finish} className={buttonClass("primary", "mt-3 h-8 w-full text-xs")}>
            {step.cta.label}
          </Link>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-foreground-tertiary transition-colors hover:text-foreground"
          >
            {isLast ? "Close" : "Skip tour"}
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="secondary" className="h-7 px-2.5 text-xs" onClick={() => setIndex(index - 1)}>
                Back
              </Button>
            )}
            <Button
              className="h-7 px-2.5 text-xs"
              onClick={() => (isLast ? finish() : setIndex(index + 1))}
              autoFocus
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
