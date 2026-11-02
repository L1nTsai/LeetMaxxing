import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-border bg-background text-foreground hover:bg-muted",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-tertiary transition-colors duration-150 hover:border-border-strong focus:border-border-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-accent ${className}`}
      {...props}
    />
  );
}

export function Label(props: ComponentProps<"label">) {
  return (
    <label
      className="text-[13px] font-medium text-foreground-secondary"
      {...props}
    />
  );
}

export type Difficulty = "easy" | "medium" | "hard";

const difficultyStyles: Record<Difficulty, string> = {
  easy: "bg-success-subtle text-success",
  medium: "bg-warning-subtle text-warning",
  hard: "bg-danger-subtle text-danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium capitalize ${difficultyStyles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
    </div>
  );
}
