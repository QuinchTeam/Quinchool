"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";

const today = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "full",
  timeZone: "Asia/Manila",
});

/** Manila hour, so the greeting matches the clock the user is actually on. */
function greetingFor(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting() {
  const { data: session, isPending } = useSession();
  const now = new Date();

  return (
    <div className="grid gap-1">
      {isPending ? (
        <Skeleton className="h-8 w-64" />
      ) : (
        <h1 className="text-2xl font-semibold">
          {greetingFor(now)}
          {session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
      )}
      <p className="text-sm text-muted-foreground">{today.format(now)}</p>
    </div>
  );
}
