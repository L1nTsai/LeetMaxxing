// Display helpers for logged attempts, shared by client and server components.

export type Rating = "again" | "hard" | "good" | "easy";

export const RATING_LABEL: Record<Rating, string> = {
  again: "Again", hard: "Hard", good: "Good", easy: "Easy",
};

export const RATING_STYLE: Record<Rating, string> = {
  again: "bg-danger-subtle text-danger",
  hard: "bg-warning-subtle text-warning",
  good: "bg-muted text-foreground",
  easy: "bg-success-subtle text-success",
};

/** 25 → "25m", 90 → "1h 30m". */
export function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}
