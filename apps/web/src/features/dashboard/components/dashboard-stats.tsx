import "server-only";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadCareer,
  loadFinance,
  loadJobs,
} from "@/features/dashboard/lib/load";
import { formatMoney } from "@/features/finance-tracker/lib/format";

const lastScanned = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function DashboardStats() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <Stats />
    </Suspense>
  );
}

async function Stats() {
  const [finance, jobs, career] = await Promise.all([
    loadFinance(),
    loadJobs(),
    loadCareer(),
  ]);

  const bulletCount = career
    ? [...career.experiences, ...career.projects].reduce(
        (total, entry) => total + entry.bullets.length,
        0,
      )
    : 0;
  const skillCount = career
    ? career.skillGroups.reduce(
        (total, group) => total + group.skills.length,
        0,
      )
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        href="/finance-tracker"
        icon={WalletIcon}
        label="Total balance"
        value={finance ? formatMoney(finance.totalBalance) : "Unavailable"}
        hint={
          finance
            ? `${finance.wallets.length} ${finance.wallets.length === 1 ? "wallet" : "wallets"}`
            : "Finance tracker is not responding"
        }
      />
      <Stat
        href="/jobs-scraper"
        icon={BriefcaseIcon}
        label="Saved jobs"
        value={jobs ? String(jobs.savedJobCount) : "Unavailable"}
        hint={
          jobs
            ? `${jobs.classificationCounts.MATCH} matches, ${jobs.classificationCounts.POTENTIAL} potential`
            : "Jobs scraper is not responding"
        }
        badge={jobs && jobs.newJobCount > 0 ? `${jobs.newJobCount} new` : null}
      />
      <Stat
        href="/jobs-scraper"
        icon={BriefcaseIcon}
        label="Last job scan"
        value={
          jobs?.lastScannedAt
            ? lastScanned.format(new Date(jobs.lastScannedAt))
            : "Never"
        }
        hint={
          jobs?.lastScannedAt ? "Run a scan to refresh" : "Run your first scan"
        }
      />
      <Stat
        href="/career-profile"
        icon={IdentificationCardIcon}
        label="Career profile"
        value={
          career
            ? `${career.experiences.length} ${career.experiences.length === 1 ? "role" : "roles"}`
            : "Empty"
        }
        hint={
          career
            ? `${career.projects.length} projects, ${skillCount} skills, ${bulletCount} bullets`
            : "Fill it in to use the resume tools"
        }
      />
    </div>
  );
}

function Stat({
  badge,
  hint,
  href,
  icon,
  label,
  value,
}: {
  badge?: string | null;
  hint: string;
  href: string;
  icon: AppIconProps["icon"];
  label: string;
  value: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card
        size="sm"
        className="h-full transition-colors group-hover:bg-secondary"
      >
        <CardContent className="grid min-w-0 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AppIcon icon={icon} className="size-4" />
            <span className="truncate text-xs">{label}</span>
            {badge && (
              <Badge variant="secondary" className="ml-auto">
                {badge}
              </Badge>
            )}
          </div>
          <p className="truncate text-xl font-semibold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Loading stats"
      aria-busy="true"
    >
      {[0, 1, 2, 3].map((tile) => (
        <Card key={tile} size="sm" className="h-full">
          <CardContent className="grid min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
