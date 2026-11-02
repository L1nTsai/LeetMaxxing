"use client";

import { useRouter } from "next/navigation";
import { TOUR_START_EVENT } from "./Tour";

/** Replays the getting-started tour, which lives on the dashboard. */
export default function TourButton() {
  const router = useRouter();

  // Read the path at click time rather than with usePathname(), so the static
  // header shell can be prerendered without a Suspense boundary.
  const start = () => {
    if (window.location.pathname === "/dashboard") window.dispatchEvent(new Event(TOUR_START_EVENT));
    else router.push("/dashboard?tour=1");
  };

  return (
    <button
      type="button"
      onClick={start}
      data-tour="tour-button"
      className="transition-colors hover:text-foreground"
    >
      Tour
    </button>
  );
}
