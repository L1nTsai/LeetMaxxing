"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionStatus = "idle" | "running" | "stopped";

type Stored = {
  status: SessionStatus;
  /** Time banked from earlier running stretches. */
  elapsedMs: number;
  /** When the current running stretch began (epoch ms); null unless running. */
  runningSince: number | null;
  notes: string;
};

const EMPTY: Stored = { status: "idle", elapsedMs: 0, runningSince: null, notes: "" };

const key = (listId: number, problemId: number) => `leetmaxxing:session:${listId}:${problemId}`;

function load(k: string): Stored {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return EMPTY;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (s.status !== "idle" && s.status !== "running" && s.status !== "stopped") return EMPTY;
    return {
      status: s.status,
      elapsedMs: Number(s.elapsedMs) || 0,
      runningSince: s.status === "running" ? Number(s.runningSince) || Date.now() : null,
      notes: typeof s.notes === "string" ? s.notes : "",
    };
  } catch {
    return EMPTY;
  }
}

/**
 * A solve session for one problem: a stopwatch plus scratch notes. It is kept
 * in localStorage so closing the window or reloading the page doesn't lose a
 * running timer. Elapsed time is computed from timestamps, so it stays right
 * while the tab is in the background.
 */
export function useSolveSession(listId: number, problemId: number) {
  const k = key(listId, problemId);
  // Only ever rendered after a click (never server-rendered), so reading storage here is safe.
  const [s, setS] = useState<Stored>(() => load(k));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      if (s.status === "idle" && !s.notes) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(s));
    } catch {
      // Storage unavailable (private mode etc.): the session still works, it just won't survive a reload.
    }
  }, [k, s]);

  // Tick once a second while running.
  useEffect(() => {
    if (s.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [s.status]);

  const elapsedMs = s.elapsedMs + (s.status === "running" && s.runningSince ? now - s.runningSince : 0);

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setS((p) => ({ ...p, status: "running", runningSince: t }));
  }, []);

  const stop = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setS((p) =>
      p.status !== "running"
        ? p
        : { ...p, status: "stopped", elapsedMs: p.elapsedMs + (t - (p.runningSince ?? t)), runningSince: null },
    );
  }, []);

  const setNotes = useCallback((notes: string) => setS((p) => ({ ...p, notes })), []);

  /** Back to 0:00 and running again. Notes are kept. */
  const restart = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setS((p) => ({ ...p, status: "running", elapsedMs: 0, runningSince: t }));
  }, []);

  const clear = useCallback(() => {
    setS(EMPTY);
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }, [k]);

  return { status: s.status, elapsedMs, notes: s.notes, setNotes, start, stop, resume: start, restart, clear };
}

export function formatClock(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Stopwatch time → minutes for the log form (at least 1, at most 300). */
export function elapsedToMinutes(ms: number) {
  return Math.min(300, Math.max(1, Math.round(ms / 60000)));
}
