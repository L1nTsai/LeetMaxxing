// Pages in this group read the local database at request time (see getDb in
// src/lib/db). This is the Suspense fallback Next shows while they render.
export default function Loading() {
  return <div className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-foreground-tertiary">Loading…</div>;
}
