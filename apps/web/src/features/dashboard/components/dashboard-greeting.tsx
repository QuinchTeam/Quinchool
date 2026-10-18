"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { DitherScene } from "@/features/dashboard/components/dither-scene";
import {
  dayPeriod,
  GREETINGS,
  greetingMessage,
  manilaClock,
} from "@/features/dashboard/lib/greeting";
import { useSession } from "@/lib/auth-client";
import { initialsOf } from "@/lib/utils";

const today = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "full",
  timeZone: "Asia/Manila",
});

const time = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});

function MiniClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      <AppIcon icon={ClockIcon} className="size-4" />
      {now ? <time dateTime={now.toISOString()}>{time.format(now)}</time> : "—"}
    </span>
  );
}

export function DashboardGreeting() {
  const { data: session, isPending } = useSession();
  // Captured once per mount: the greeting should not change mid-visit.
  const [now] = useState(() => new Date());
  // Manila clock, so the greeting matches the time the user is actually on.
  const { hour, weekday } = manilaClock(now);
  const period = dayPeriod(hour);
  const user = session?.user;

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <DitherScene period={period} />
        <div className="grid min-w-0 gap-1">
          {isPending ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="truncate text-2xl font-semibold">
              {GREETINGS[period]}
              {user?.name ? `, ${user.name}` : ""}
            </h1>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <AppIcon icon={CalendarBlankIcon} className="size-4" />
              {today.format(now)}
            </span>
            <MiniClock />
            <span className="flex items-center gap-1.5 font-light italic">
              <AppIcon icon={MegaphoneIcon} className="size-4" />
              {greetingMessage(weekday, period)}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 pl-2"
        nativeButton={false}
        render={<Link href="/profile" />}
      >
        {isPending ? (
          <Skeleton className="size-8 rounded-full" />
        ) : (
          <Avatar size="sm">
            {user?.image && (
              <AvatarImage
                render={
                  <Image
                    src={user.image}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                  />
                }
              />
            )}
            <AvatarFallback>{initialsOf(user?.name ?? "")}</AvatarFallback>
          </Avatar>
        )}
        Profile
      </Button>
    </header>
  );
}
