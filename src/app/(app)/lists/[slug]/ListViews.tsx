"use client";

import {
  useState, useRef, useEffect, useCallback, useLayoutEffect,
} from "react";
import { DifficultyBadge, Button } from "@/components/ui";
import { leetcodeUrl } from "@/lib/constants";
import LogModal from "./LogModal";
import type { LogModalMode } from "./LogModal";

export type TopicSlug =
  | "arrays-hashing" | "two-pointers" | "sliding-window" | "stack"
  | "binary-search" | "linked-list" | "trees" | "tries" | "heap"
  | "backtracking" | "graphs" | "advanced-graphs" | "dp-1d" | "dp-2d"
  | "greedy" | "intervals" | "math-geometry" | "bit-manipulation";

export type ProblemRow = {
  id: number;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topicSlug: TopicSlug;
  topicName: string;
  status: "attempted" | "solved" | null;
  dueOn: string | null;
  position: number;
  hasNotes: boolean;
};

type Props = {
  listId: number;
  listName: string;
  problems: ProblemRow[];
  today: string;
};

// ── Roadmap layout ────────────────────────────────────────────────────────────

const NODE_W = 148;
const NODE_H = 58;
const CANVAS_W = 860;
const CANVAS_H = 890;

// Topic order for the list panel (roadmap top-to-bottom)
const TOPIC_ORDER: TopicSlug[] = [
  "arrays-hashing", "two-pointers", "stack",
  "binary-search", "sliding-window", "linked-list",
  "trees", "tries", "backtracking",
  "heap", "graphs", "dp-1d",
  "intervals", "greedy", "advanced-graphs", "dp-2d", "bit-manipulation",
  "math-geometry",
];

const TOPIC_NAMES: Record<TopicSlug, string> = {
  "arrays-hashing":   "Arrays & Hashing",
  "two-pointers":     "Two Pointers",
  "sliding-window":   "Sliding Window",
  "stack":            "Stack",
  "binary-search":    "Binary Search",
  "linked-list":      "Linked List",
  "trees":            "Trees",
  "tries":            "Tries",
  "heap":             "Heap / Priority Queue",
  "backtracking":     "Backtracking",
  "graphs":           "Graphs",
  "advanced-graphs":  "Advanced Graphs",
  "dp-1d":            "1-D Dynamic Programming",
  "dp-2d":            "2-D Dynamic Programming",
  "greedy":           "Greedy",
  "intervals":        "Intervals",
  "math-geometry":    "Math & Geometry",
  "bit-manipulation": "Bit Manipulation",
};

const NODE_LABELS: Record<TopicSlug, string[]> = {
  "arrays-hashing":   ["Arrays & Hashing"],
  "two-pointers":     ["Two Pointers"],
  "sliding-window":   ["Sliding Window"],
  "stack":            ["Stack"],
  "binary-search":    ["Binary Search"],
  "linked-list":      ["Linked List"],
  "trees":            ["Trees"],
  "tries":            ["Tries"],
  "heap":             ["Heap / Priority", "Queue"],
  "backtracking":     ["Backtracking"],
  "graphs":           ["Graphs"],
  "advanced-graphs":  ["Advanced Graphs"],
  "dp-1d":            ["1-D Dynamic", "Programming"],
  "dp-2d":            ["2-D Dynamic", "Programming"],
  "greedy":           ["Greedy"],
  "intervals":        ["Intervals"],
  "math-geometry":    ["Math & Geometry"],
  "bit-manipulation": ["Bit Manipulation"],
};

const POSITIONS: Record<TopicSlug, { cx: number; y: number }> = {
  "arrays-hashing":   { cx: 430, y: 20  },
  "two-pointers":     { cx: 258, y: 118 },
  "stack":            { cx: 602, y: 118 },
  "binary-search":    { cx: 108, y: 236 },
  "sliding-window":   { cx: 340, y: 236 },
  "linked-list":      { cx: 572, y: 236 },
  "trees":            { cx: 340, y: 354 },
  "tries":            { cx: 148, y: 454 },
  "backtracking":     { cx: 532, y: 454 },
  "heap":             { cx: 268, y: 556 },
  "graphs":           { cx: 472, y: 556 },
  "dp-1d":            { cx: 664, y: 556 },
  "intervals":        { cx: 68,  y: 668 },
  "greedy":           { cx: 232, y: 668 },
  "advanced-graphs":  { cx: 432, y: 668 },
  "dp-2d":            { cx: 612, y: 668 },
  "bit-manipulation": { cx: 792, y: 668 },
  "math-geometry":    { cx: 692, y: 800 },
};

const EDGES: [TopicSlug, TopicSlug][] = [
  ["arrays-hashing",  "two-pointers"],
  ["arrays-hashing",  "stack"],
  ["two-pointers",    "binary-search"],
  ["two-pointers",    "sliding-window"],
  ["stack",           "sliding-window"],
  ["stack",           "linked-list"],
  ["binary-search",   "trees"],
  ["sliding-window",  "trees"],
  ["linked-list",     "trees"],
  ["trees",           "tries"],
  ["trees",           "backtracking"],
  ["tries",           "heap"],
  ["backtracking",    "heap"],
  ["backtracking",    "graphs"],
  ["heap",            "graphs"],
  ["heap",            "intervals"],
  ["graphs",          "dp-1d"],
  ["graphs",          "advanced-graphs"],
  ["dp-1d",           "dp-2d"],
  ["dp-1d",           "bit-manipulation"],
  ["advanced-graphs", "dp-2d"],
  ["intervals",       "greedy"],
  ["dp-2d",           "greedy"],
  ["dp-2d",           "math-geometry"],
  ["greedy",          "math-geometry"],
];

// ── Root ──────────────────────────────────────────────────────────────────────

export default function ListViews({ listId, listName, problems, today }: Props) {
  const [activeTopic, setActiveTopic] = useState<TopicSlug | null>(null);
  // Topic of the problem under the cursor; overrides the scroll-tracked topic while set.
  const [hoveredTopic, setHoveredTopic] = useState<TopicSlug | null>(null);
  // Last cursor position seen over the list, so rows sliding under a still cursor
  // during a scroll don't count as hovering.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const [logProblem, setLogProblem] = useState<{ problem: ProblemRow; mode: LogModalMode } | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  // While a roadmap click is smooth-scrolling the list, keep the clicked topic active.
  const programmaticScroll = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-topic stats for node progress bars
  const topicStats: Record<string, { total: number; solved: number }> = {};
  for (const p of problems) {
    if (!topicStats[p.topicSlug]) topicStats[p.topicSlug] = { total: 0, solved: 0 };
    topicStats[p.topicSlug].total++;
    if (p.status === "solved") topicStats[p.topicSlug].solved++;
  }

  const solved = problems.filter((p) => p.status === "solved").length;

  // Group problems by topic in roadmap order
  const topicGroups = TOPIC_ORDER
    .map((slug) => ({
      slug,
      name: TOPIC_NAMES[slug],
      problems: problems.filter((p) => p.topicSlug === slug),
    }))
    .filter((g) => g.problems.length > 0);

  // Position of a topic section relative to the top of the list's scroll content.
  // (offsetTop would be relative to the panel, which includes the header.)
  const sectionTop = (container: HTMLElement, el: HTMLElement) =>
    el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;

  // Scroll list panel to a topic
  const scrollToTopic = useCallback((slug: TopicSlug) => {
    const container = listScrollRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-topic="${slug}"]`);
    setActiveTopic(slug);
    if (!el) return;
    if (programmaticScroll.current) clearTimeout(programmaticScroll.current);
    programmaticScroll.current = setTimeout(() => { programmaticScroll.current = null; }, 800);
    container.scrollTo({ top: sectionTop(container, el), behavior: "smooth" });
  }, []);

  // Track active topic as user scrolls the list
  const handleListScroll = useCallback(() => {
    const container = listScrollRef.current;
    if (!container || programmaticScroll.current) return;
    const scrollTop = container.scrollTop;
    let best: TopicSlug | null = null;
    let bestDist = Infinity;
    for (const slug of TOPIC_ORDER) {
      const el = container.querySelector<HTMLElement>(`[data-topic="${slug}"]`);
      if (!el) continue;
      const dist = Math.abs(sectionTop(container, el) - scrollTop - 32);
      if (dist < bestDist) { bestDist = dist; best = slug; }
    }
    setActiveTopic(best);
  }, []);

  const onListScroll = useCallback(() => {
    // Scrolling hands control back to the scroll tracker until the mouse actually moves.
    setHoveredTopic(null);
    handleListScroll();
  }, [handleListScroll]);

  const onListMouseMove = useCallback((e: React.MouseEvent) => {
    const last = lastPointer.current;
    if (last && last.x === e.clientX && last.y === e.clientY) return; // scroll-induced, not real movement
    lastPointer.current = { x: e.clientX, y: e.clientY };
    const slug =
      ((e.target as Element).closest("[data-topic]")?.getAttribute("data-topic") as TopicSlug | null) ?? null;
    setHoveredTopic(slug);
  }, []);

  const onListMouseLeave = useCallback(() => {
    lastPointer.current = null;
    setHoveredTopic(null);
  }, []);

  return (
    <div className="flex-1 overflow-hidden relative">
      {logProblem && (
        <LogModal
          key={`${logProblem.problem.id}-${logProblem.mode}`}
          problem={logProblem.problem}
          initialMode={logProblem.mode}
          listId={listId}
          onClose={() => setLogProblem(null)}
        />
      )}
      {/* Roadmap fills everything */}
      <RoadmapCanvas
        topicStats={topicStats}
        activeTopic={hoveredTopic ?? activeTopic}
        onNodeClick={scrollToTopic}
      />

      {/* Floating list panel */}
      <div
        className="absolute right-4 top-4 bottom-4 flex flex-col rounded-xl border border-border bg-background"
        style={{ width: 340, boxShadow: "none" }}
      >
        {/* Panel header */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold text-sm">{listName}</h2>
            <span className="text-xs text-foreground-secondary tabular-nums">
              {solved}/{problems.length}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${problems.length ? Math.round(solved / problems.length * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Scrollable problem list */}
        <div
          ref={listScrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={onListScroll}
          onMouseMove={onListMouseMove}
          onMouseLeave={onListMouseLeave}
        >
          {topicGroups.map((group) => (
            <div key={group.slug} data-topic={group.slug}>
              {/* Topic heading */}
              <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2">
                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                  {group.name}
                </span>
              </div>

              {/* Problems */}
              {group.problems.map((p) => (
                <ProblemItem
                  key={`${p.id}`}
                  problem={p}
                  today={today}
                  onOpen={(problem, mode) => setLogProblem({ problem, mode })}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Problem item ──────────────────────────────────────────────────────────────

function ProblemItem({
  problem: p,
  today,
  onOpen,
}: {
  problem: ProblemRow;
  today: string;
  onOpen: (p: ProblemRow, mode: LogModalMode) => void;
}) {
  const isOverdue = p.dueOn ? p.dueOn <= today : false;

  const statusColor =
    p.status === "solved"
      ? isOverdue
        ? "var(--warning)"
        : "var(--success)"
      : p.status === "attempted"
      ? "var(--foreground)"
      : "var(--border-strong)";

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-background-subtle transition-colors border-b border-border last:border-0">
      {/* Status dot */}
      <div
        className="shrink-0 rounded-full"
        style={{ width: 7, height: 7, background: statusColor }}
      />

      {/* Title */}
      <a
        href={leetcodeUrl(p.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 truncate text-foreground hover:text-accent transition-colors"
      >
        {p.title}
      </a>

      {/* Notes */}
      {p.hasNotes && (
        <button
          type="button"
          onClick={() => onOpen(p, "notes")}
          className="shrink-0 rounded p-0.5 text-foreground-tertiary hover:text-foreground transition-colors"
          aria-label={`View notes for ${p.title}`}
          title="View notes"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 1.75h6l3 3v9.5h-9z" />
            <path d="M9.5 1.75v3h3" />
            <path d="M5.75 8.25h4.5M5.75 10.75h3" />
          </svg>
        </button>
      )}

      {/* Difficulty */}
      <DifficultyBadge difficulty={p.difficulty} />

      {/* Start a first attempt, or review one already started */}
      <Button
        variant="secondary"
        onClick={() => onOpen(p, "session")}
        className="shrink-0 h-6 w-14 px-2 text-[10px]"
      >
        {p.status === null ? "Start" : "Review"}
      </Button>
    </div>
  );
}

// ── Roadmap canvas with pan + zoom ────────────────────────────────────────────

type Transform = { x: number; y: number; scale: number };

function RoadmapCanvas({
  topicStats,
  activeTopic,
  onNodeClick,
}: {
  topicStats: Record<string, { total: number; solved: number }>;
  activeTopic: TopicSlug | null;
  onNodeClick: (slug: TopicSlug) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const transformRef = useRef(transform);
  const dragStart = useRef<{ cx: number; cy: number; px: number; py: number } | null>(null);
  const didDrag = useRef(false);
  const pressedNode = useRef<TopicSlug | null>(null);

  useEffect(() => { transformRef.current = transform; }, [transform]);

  // Initial fit (leave room for the panel)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const availW = width - 360; // leave space for panel
    const scale = Math.min(1, availW / CANVAS_W, height / CANVAS_H) * 0.92;
    const x = (availW - CANVAS_W * scale) / 2;
    const y = (height - CANVAS_H * scale) / 2;
    const t = { x, y, scale };
    setTransform(t);
    transformRef.current = t;
  }, []);

  // Wheel → zoom toward cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const t = transformRef.current;
      const newScale = Math.min(4, Math.max(0.15, t.scale * factor));
      const ratio = newScale / t.scale;
      const next = { scale: newScale, x: mx - (mx - t.x) * ratio, y: my - (my - t.y) * ratio };
      transformRef.current = next;
      setTransform(next);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragStart.current = { cx: e.clientX, cy: e.clientY, px: transformRef.current.x, py: transformRef.current.y };
    didDrag.current = false;
    pressedNode.current =
      ((e.target as Element).closest("[data-node]")?.getAttribute("data-node") as TopicSlug | null) ?? null;
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.cx;
    const dy = e.clientY - dragStart.current.cy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    const next = { ...transformRef.current, x: dragStart.current.px + dx, y: dragStart.current.py + dy };
    transformRef.current = next;
    setTransform(next);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const wasPress = dragStart.current !== null;
    dragStart.current = null;
    setIsDragging(false);
    // A press-and-release on a node without panning counts as a click on it.
    if (wasPress && e.type === "pointerup" && !didDrag.current && pressedNode.current) {
      onNodeClick(pressedNode.current);
    }
    pressedNode.current = null;
  }, [onNodeClick]);

  const resetTransform = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const availW = width - 360;
    const scale = Math.min(1, availW / CANVAS_W, height / CANVAS_H) * 0.92;
    const next = { x: (availW - CANVAS_W * scale) / 2, y: (height - CANVAS_H * scale) / 2, scale };
    transformRef.current = next;
    setTransform(next);
  }, []);

  const BAR_PAD = 12;
  const BAR_Y = NODE_H - 14;
  const BAR_H = 4;
  const barW = NODE_W - BAR_PAD * 2;

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        onClick={resetTransform}
        className="absolute bottom-3 left-3 z-10 rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground-secondary hover:text-foreground transition-colors"
      >
        Reset view
      </button>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block", cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {EDGES.map(([from, to], i) => {
            const a = POSITIONS[from], b = POSITIONS[to];
            const x1 = a.cx, y1 = a.y + NODE_H, x2 = b.cx, y2 = b.y;
            const mid = (y1 + y2) / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Nodes */}
          {(Object.entries(POSITIONS) as [TopicSlug, { cx: number; y: number }][]).map(([slug, pos]) => {
            const stats = topicStats[slug] ?? { total: 0, solved: 0 };
            const pct = stats.total === 0 ? 0 : stats.solved / stats.total;
            const done = stats.total > 0 && stats.solved === stats.total;
            const isActive = activeTopic === slug;
            const labels = NODE_LABELS[slug];
            const nx = pos.cx - NODE_W / 2;
            const ny = pos.y;

            const textBaseY =
              labels.length === 1
                ? ny + NODE_H / 2 - BAR_H - 4
                : ny + NODE_H / 2 - BAR_H - 10;

            const stroke = isActive
              ? "var(--accent)"
              : done
              ? "var(--success)"
              : "var(--border)";
            const strokeWidth = isActive ? 2.5 : 1.5;
            const fill = isActive
              ? "color-mix(in srgb, var(--accent) 8%, var(--background))"
              : done
              ? "color-mix(in srgb, var(--success) 8%, var(--background))"
              : "var(--background)";

            return (
              <g
                key={slug}
                data-node={slug}
                role="button"
                tabIndex={0}
                aria-label={`Go to ${TOPIC_NAMES[slug]}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNodeClick(slug); }
                }}
                style={{ cursor: isDragging ? "grabbing" : "pointer" }}
              >
                <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

                {labels.map((line, li) => (
                  <text
                    key={li}
                    x={pos.cx}
                    y={textBaseY + li * 13}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isActive ? "var(--accent)" : "var(--foreground)"}
                    fontSize={11}
                    fontWeight={isActive ? 600 : 500}
                    style={{ fontFamily: "var(--font-geist-sans, sans-serif)", pointerEvents: "none" }}
                  >
                    {line}
                  </text>
                ))}

                {/* Progress bar */}
                <rect x={nx + BAR_PAD} y={ny + BAR_Y} width={barW} height={BAR_H} rx={2} fill="var(--muted)" />
                {pct > 0 && (
                  <rect
                    x={nx + BAR_PAD} y={ny + BAR_Y}
                    width={barW * pct} height={BAR_H} rx={2}
                    fill={done ? "var(--success)" : isActive ? "var(--accent)" : "var(--foreground)"}
                  />
                )}

                {/* Hit target */}
                <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8} fill="transparent" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
