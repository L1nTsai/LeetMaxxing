import { localDay } from "./day.ts";

export type SrsMethod = "sm2" | "leitner" | "2357" | "custom";
export type Rating = "again" | "hard" | "good" | "easy";

type State = { repetitions: number; ease_factor: number; interval_days: number };
export type SrsResult = {
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  due_on: string;
};

// Preset intervals for built-in methods
export const LEITNER_INTERVALS = [1, 3, 7, 14, 30, 60];
export const INTERVALS_2357   = [2, 3, 5, 7, 14, 30];

export const SRS_METHODS: Record<SrsMethod, { label: string; description: string; presetIntervals?: number[] }> = {
  sm2: {
    label: "SM-2",
    description: "Classic algorithm: intervals grow with ease factor per-card. Best all-around.",
  },
  leitner: {
    label: "Leitner Boxes",
    description: "6 boxes with fixed intervals (1→3→7→14→30→60 days). Simple and battle-tested.",
    presetIntervals: LEITNER_INTERVALS,
  },
  "2357": {
    label: "2-3-5-7",
    description: "Tight fixed schedule (2→3→5→7→14→30 days). Good for cramming or interview prep.",
    presetIntervals: INTERVALS_2357,
  },
  custom: {
    label: "Custom",
    description: "Your own interval ladder. Set any sequence of days between reviews.",
  },
};

function addDays(n: number): string {
  return localDay(new Date(), n);
}

// SM-2: quality-weighted ease factor, unlimited growth
function sm2(state: State, rating: Rating): SrsResult {
  const q = { again: 0, hard: 3, good: 4, easy: 5 }[rating];
  let { repetitions, ease_factor } = state;
  let interval: number;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(state.interval_days * ease_factor);
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    ease_factor = Math.round(ease_factor * 100) / 100;
    repetitions++;
  }

  return { repetitions, ease_factor, interval_days: interval, due_on: addDays(interval) };
}

// Index-based: repetitions = index into intervals array
function indexBased(state: State, rating: Rating, intervals: number[]): SrsResult {
  const max = intervals.length - 1;
  let idx = Math.min(state.repetitions, max);

  if (rating === "again")     idx = 0;
  else if (rating === "hard") { /* stay */ }
  else if (rating === "good") idx = Math.min(idx + 1, max);
  else                         idx = Math.min(idx + 2, max);

  const interval = intervals[idx];
  return { repetitions: idx, ease_factor: 2.5, interval_days: interval, due_on: addDays(interval) };
}

export function applySpacedRepetition(
  state: State,
  rating: Rating,
  method: SrsMethod,
  customIntervals: number[],
): SrsResult {
  const fallback = [1, 3, 7];
  switch (method) {
    case "sm2":     return sm2(state, rating);
    case "leitner": return indexBased(state, rating, LEITNER_INTERVALS);
    case "2357":    return indexBased(state, rating, INTERVALS_2357);
    case "custom":  return indexBased(state, rating, customIntervals.length ? customIntervals : fallback);
  }
}

export function isPass(rating: Rating): boolean {
  return rating === "good" || rating === "easy";
}
