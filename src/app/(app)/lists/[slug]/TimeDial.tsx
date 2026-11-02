"use client";

import { useRef } from "react";

type Props = {
  value: number;
  onChange: (minutes: number) => void;
  max?: number;
};

const SIZE = 168;
const C = SIZE / 2;
const R = 64; // track radius
const STROKE = 10;

/** Angle (0–360, clockwise from 12 o'clock) → point on a circle of radius r. */
function polar(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function arcPath(minutes: number) {
  const end = (minutes / 60) * 360;
  const a = polar(0, R);
  const b = polar(end, R);
  const large = end > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
}

import { formatMinutes } from "@/lib/attempts";
export { formatMinutes };

/**
 * Clock-face dial for picking a duration. One full lap = 60 minutes; dragging
 * past 12 o'clock keeps counting into the next hour (or back down).
 */
export default function TimeDial({ value, onChange, max = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const last = useRef(value);

  const clamp = (m: number) => Math.max(0, Math.min(max, m));

  const minuteAt = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.round(deg / 6) % 60;
  };

  const update = (clientX: number, clientY: number, isPress = false) => {
    const prev = last.current;
    const m = minuteAt(clientX, clientY);
    const prevM = prev % 60;
    let hours = Math.floor(prev / 60);
    let next: number;
    if (isPress) {
      // A click jumps to that minute within the current hour.
      next = clamp(hours * 60 + m);
    } else {
      // Crossing 12 o'clock while dragging: wrap into the next / previous hour.
      if (prevM > 45 && m < 15) hours += 1;
      else if (prevM < 15 && m > 45) hours -= 1;
      // Dragging counter-clockwise past zero pins at zero instead of jumping to 59.
      next = hours < 0 ? 0 : clamp(hours * 60 + m);
    }
    last.current = next;
    if (next !== value) onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    last.current = value;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX, e.clientY, true);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) update(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key];
    if (step) {
      e.preventDefault();
      onChange(clamp(value + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0);
    }
  };

  const inLap = value % 60;
  const fullLaps = Math.floor(value / 60);
  const handle = polar((inLap / 60) * 360, R);

  return (
    <svg
      ref={svgRef}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="slider"
      tabIndex={0}
      aria-label="Time spent in minutes"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={value ? formatMinutes(value) : "Not set"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="cursor-grab touch-none select-none rounded-full active:cursor-grabbing"
    >
      {/* Track: full ring once at least one hour has elapsed */}
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        strokeWidth={STROKE}
        className={fullLaps > 0 ? "stroke-foreground-tertiary" : "stroke-muted"}
      />

      {/* Tick marks every 5 minutes, longer at quarters */}
      {Array.from({ length: 12 }, (_, i) => {
        const quarter = i % 3 === 0;
        const a = polar(i * 30, R - STROKE / 2 - 4);
        const b = polar(i * 30, R - STROKE / 2 - (quarter ? 12 : 8));
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            strokeWidth={quarter ? 2 : 1}
            strokeLinecap="round"
            className="stroke-border-strong"
          />
        );
      })}

      {/* Elapsed arc within the current hour */}
      {inLap > 0 && (
        <path d={arcPath(inLap)} fill="none" strokeWidth={STROKE} strokeLinecap="round" className="stroke-foreground" />
      )}

      {/* Handle */}
      <circle cx={handle.x} cy={handle.y} r={9} className="fill-background stroke-foreground" strokeWidth={2.5} />

      {/* Readout */}
      <text x={C} y={C - 2} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-semibold tabular-nums">
        {value ? formatMinutes(value) : "—"}
      </text>
      <text x={C} y={C + 18} textAnchor="middle" dominantBaseline="middle" className="fill-foreground-tertiary text-[10px]">
        {value ? `${value} min` : "drag to set"}
      </text>
    </svg>
  );
}
