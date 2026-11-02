"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * A dashboard card that flips open into a popup window.
 *
 * Open: the card turns edge-on (0 → 90°), then the popup turns the rest of the
 * way (-90 → 0°) while growing from the card's spot to the centre of the
 * screen. Close plays the same thing backwards. Respects reduced motion.
 */

const CloseContext = createContext<() => void>(() => {});
/** Lets popup content close its window (with the flip back). */
export const useFlipClose = () => useContext(CloseContext);

const PERSPECTIVE = "perspective(1200px)";
const HALF_MS = 170; // card turning away
const GROW_MS = 320; // popup turning in and growing

type Props = {
  /** Card face, shown on the dashboard. */
  children: ReactNode;
  /** Popup content. */
  panel: ReactNode;
  /** Popup heading. */
  title: string;
  /** Accessible name for the card. */
  label: string;
  className?: string;
  /** Tailwind max-width class for the popup. */
  panelWidth?: string;
  "data-tour"?: string;
};

export default function FlipCard({
  children, panel, title, label, className = "", panelWidth = "max-w-2xl", ...rest
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Transform that puts the dialog exactly over the card. */
  const toCard = useCallback(() => {
    const card = cardRef.current!.getBoundingClientRect();
    const dlg = dialogRef.current!.getBoundingClientRect();
    const dx = card.left + card.width / 2 - (dlg.left + dlg.width / 2);
    const dy = card.top + card.height / 2 - (dlg.top + dlg.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${card.width / dlg.width}, ${card.height / dlg.height})`;
  }, []);

  const openPanel = async () => {
    if (busy.current || open) return;
    busy.current = true;
    const card = cardRef.current!;
    if (!reduced()) {
      await card.animate(
        [{ transform: `${PERSPECTIVE} rotateY(0deg)` }, { transform: `${PERSPECTIVE} rotateY(90deg)` }],
        { duration: HALF_MS, easing: "ease-in" },
      ).finished;
    }
    card.style.visibility = "hidden"; // the card "is" the popup now
    setOpen(true);
  };

  // After the dialog mounts: show it and run the grow-in half of the flip.
  useEffect(() => {
    if (!open) return;
    const dlg = dialogRef.current!;
    dlg.showModal();
    if (reduced()) { busy.current = false; return; }
    const from = toCard();
    const anim = dlg.animate(
      [
        { transform: `${PERSPECTIVE} ${from} rotateY(-90deg)` },
        { transform: `${PERSPECTIVE} translate(0, 0) scale(1, 1) rotateY(0deg)` },
      ],
      { duration: GROW_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
    dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GROW_MS, pseudoElement: "::backdrop" });
    anim.finished.then(() => { busy.current = false; }, () => { busy.current = false; });
  }, [open, toCard]);

  const close = useCallback(async () => {
    if (busy.current || !open) return;
    busy.current = true;
    const dlg = dialogRef.current!;
    const card = cardRef.current!;
    if (!reduced()) {
      dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: GROW_MS * 0.8, pseudoElement: "::backdrop", fill: "forwards" });
      await dlg.animate(
        [
          { transform: `${PERSPECTIVE} translate(0, 0) scale(1, 1) rotateY(0deg)` },
          { transform: `${PERSPECTIVE} ${toCard()} rotateY(-90deg)` },
        ],
        { duration: GROW_MS * 0.8, easing: "ease-in", fill: "forwards" },
      ).finished;
    }
    dlg.close();
    setOpen(false);
    card.style.visibility = "";
    if (!reduced()) {
      await card.animate(
        [{ transform: `${PERSPECTIVE} rotateY(90deg)` }, { transform: `${PERSPECTIVE} rotateY(0deg)` }],
        { duration: HALF_MS, easing: "ease-out" },
      ).finished;
    }
    busy.current = false;
    card.focus();
  }, [open, toCard]);

  return (
    <>
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-haspopup="dialog"
        onClick={openPanel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPanel(); }
        }}
        className={`cursor-pointer rounded-lg border border-border p-5 transition-colors hover:border-border-strong hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-accent ${className}`}
        {...rest}
      >
        {children}
      </div>

      {open && (
        <dialog
          ref={dialogRef}
          aria-label={title}
          onCancel={(e) => { e.preventDefault(); close(); }}
          onClick={(e) => { if (e.target === dialogRef.current) close(); }}
          className={`m-auto w-[calc(100%-2rem)] ${panelWidth} max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-border bg-background p-0 text-left text-foreground backdrop:bg-black/50 [backface-visibility:hidden]`}
          style={{ padding: 0 }}
        >
          <CloseContext.Provider value={close}>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{title}</h2>
                <button
                  type="button"
                  onClick={close}
                  className="text-lg leading-none text-foreground-tertiary transition-colors hover:text-foreground"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {panel}
            </div>
          </CloseContext.Provider>
        </dialog>
      )}
    </>
  );
}
