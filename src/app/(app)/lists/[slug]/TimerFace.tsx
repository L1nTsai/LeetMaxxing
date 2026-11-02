"use client";

import { useState } from "react";
import { formatClock } from "./useSolveSession";

type Face = "digital" | "analog";
const STORAGE_KEY = "leetmaxxing:timer-face";

function loadFace(): Face {
  try {
    return localStorage.getItem(STORAGE_KEY) === "analog" ? "analog" : "digital";
  } catch {
    return "digital";
  }
}

/**
 * The session stopwatch. Click it to switch between a digital readout and an
 * analog face; the choice is remembered in this browser.
 */
export default function TimerFace({
  elapsedMs, running, large = false,
}: { elapsedMs: number; running: boolean; /** Fullscreen sizing. */ large?: boolean }) {
  // Only rendered client-side after a click, so reading storage in the initializer is safe.
  const [face, setFace] = useState<Face>(loadFace);

  const toggle = () => {
    const next: Face = face === "digital" ? "analog" : "digital";
    setFace(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* not persisted; fine */ }
  };

  const label = formatClock(elapsedMs);

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${face === "digital" ? "analog" : "digital"}`}
      aria-label={`Elapsed ${label}. Switch to ${face === "digital" ? "analog" : "digital"} clock`}
      className="rounded-lg px-3 py-1 transition-colors hover:bg-background-subtle"
    >
      <span role="timer" aria-live="off">
        {face === "digital" ? (
          <span
            className={`block font-mono ${large ? "text-8xl md:text-9xl" : "text-5xl"} font-semibold tabular-nums ${running ? "text-foreground" : "text-foreground-secondary"}`}
          >
            {label}
          </span>
        ) : (
          <AnalogFace elapsedMs={elapsedMs} running={running} size={large ? 360 : SIZE} />
        )}
      </span>
    </button>
  );
}

const SIZE = 168;
const C = SIZE / 2;
const R = 74;

function polar(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

/** Stopwatch face: long hand = seconds, short hand = minutes (one lap per hour). */
function AnalogFace({ elapsedMs, running, size }: { elapsedMs: number; running: boolean; size: number }) {
  const totalSec = Math.floor(elapsedMs / 1000);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hours = Math.floor(totalSec / 3600);

  const secAngle = sec * 6;
  const minAngle = (min + sec / 60) * 6;
  const secTip = polar(secAngle, R - 10);
  const secTail = polar(secAngle + 180, 12);
  const minTip = polar(minAngle, R - 36); // stops short of the quarter labels
  const tone = running ? "stroke-foreground" : "stroke-foreground-secondary";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block" aria-hidden="true">
      <circle cx={C} cy={C} r={R} fill="none" strokeWidth={2} className="stroke-border-strong" />

      {/* 60 ticks, longer every 5 */}
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        const a = polar(i * 6, R - 4);
        const b = polar(i * 6, R - (major ? 12 : 7));
        return (
          <line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            strokeWidth={major ? 2 : 1}
            strokeLinecap="round"
            className={major ? "stroke-foreground-secondary" : "stroke-border-strong"}
          />
        );
      })}

      {/* Minute labels at the quarters */}
      {[0, 15, 30, 45].map((m) => {
        const p = polar(m * 6, R - 24);
        return (
          <text key={m} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            className="fill-foreground-tertiary text-[10px] tabular-nums">
            {m === 0 ? 60 : m}
          </text>
        );
      })}

      {/* Whole hours elapsed */}
      {hours > 0 && (
        <text x={C} y={C + 28} textAnchor="middle" dominantBaseline="central"
          className="fill-foreground-secondary text-[11px] font-medium tabular-nums">
          +{hours}h
        </text>
      )}

      {/* Minute hand */}
      <line x1={C} y1={C} x2={minTip.x} y2={minTip.y} strokeWidth={5} strokeLinecap="round" className={tone} />
      {/* Second hand */}
      <line x1={secTail.x} y1={secTail.y} x2={secTip.x} y2={secTip.y} strokeWidth={1.5} strokeLinecap="round" className={tone} />
      <circle cx={C} cy={C} r={4} className="fill-background stroke-foreground" strokeWidth={2} />
    </svg>
  );
}
