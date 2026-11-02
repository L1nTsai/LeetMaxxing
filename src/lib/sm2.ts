// SM-2 spaced repetition algorithm.
// Rating → quality mapping: again=0, hard=3, good=4, easy=5.
// Quality < 3 resets the card; >= 3 advances the schedule.

export type Rating = "again" | "hard" | "good" | "easy";

const QUALITY: Record<Rating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export interface SM2State {
  repetitions: number;
  ease_factor: number;
  interval_days: number;
}

export interface SM2Result extends SM2State {
  due_on: string; // YYYY-MM-DD
}

export function applySM2(state: SM2State, rating: Rating): SM2Result {
  const q = QUALITY[rating];
  const { repetitions, ease_factor, interval_days } = state;

  const newEF = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  let newRepetitions: number;
  let newInterval: number;

  if (q < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval_days * ease_factor);
    }
  }

  const due = new Date();
  due.setUTCDate(due.getUTCDate() + newInterval);

  return {
    repetitions: newRepetitions,
    ease_factor: Math.round(newEF * 100) / 100, // keep 2 decimal places
    interval_days: newInterval,
    due_on: due.toISOString().slice(0, 10),
  };
}
