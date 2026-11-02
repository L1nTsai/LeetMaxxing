import { redirect } from "next/navigation";

// No landing page: everyone goes straight to the dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
