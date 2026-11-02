import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import TourButton from "@/components/TourButton";
import ReminderWatcher from "@/components/ReminderWatcher";

const navLink = "hover:text-foreground transition-colors";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ReminderWatcher />
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-5 text-sm text-foreground-secondary">
          <Link href="/dashboard" className="font-semibold text-foreground">{APP_NAME}</Link>
          <nav className="flex items-center gap-4">
            <Link href="/lists" className={navLink} data-tour="nav-lists">Lists</Link>
            <Link href="/reviews" className={navLink} data-tour="nav-reviews">Reviews</Link>
            <Link href="/settings" className={navLink} data-tour="nav-settings">Settings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-foreground-secondary">
          <TourButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
