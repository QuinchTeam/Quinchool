import "server-only";

import {
  ArrowRight01Icon,
  Briefcase01Icon,
  FilePenIcon,
  UserAccountIcon,
  UserCircleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import {
  amountClassName,
  formatMoney,
  formatTransactionDate,
} from "@/features/finance-tracker/lib/format";
import type {
  FinanceOverview,
  TransactionPage,
} from "@/features/finance-tracker/lib/types";
import type { JobScraperState } from "@/features/jobs-scraper/lib/schema";
import { apiUrl } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";
import { cn } from "@/lib/utils";

/** Every tile degrades to "unavailable" on its own, so one API being down
 * still leaves the rest of the dashboard useful. */
async function load<T>(path: string, cookie: string): Promise<T | null> {
  try {
    return await observeOperation("dashboard.tile", async () => {
      const response = await apiFetch(apiUrl(path), {
        headers: { cookie },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const body = await response.text();
      return body ? (JSON.parse(body) as T) : null;
    });
  } catch {
    return null;
  }
}

const lastScanned = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export async function DashboardHome() {
  const cookie = (await cookies()).toString();
  const [finance, jobs, career, transactions] = await observeOperation(
    "dashboard.load",
    () =>
      Promise.all([
        load<FinanceOverview>("/finance-tracker", cookie),
        load<JobScraperState>("/jobs-scraper", cookie),
        load<CareerProfileValues>("/career-profile", cookie),
        load<TransactionPage>("/finance-tracker/transactions?limit=5", cookie),
      ]),
  );

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
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <DashboardGreeting />
        <Button
          aria-label="Profile"
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/profile" />}
        >
          <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          href="/finance-tracker"
          icon={Wallet01Icon}
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
          icon={Briefcase01Icon}
          label="Saved jobs"
          value={jobs ? String(jobs.savedJobCount) : "Unavailable"}
          hint={
            jobs
              ? `${jobs.classificationCounts.MATCH} matches, ${jobs.classificationCounts.POTENTIAL} potential`
              : "Jobs scraper is not responding"
          }
          badge={
            jobs && jobs.newJobCount > 0 ? `${jobs.newJobCount} new` : null
          }
        />
        <Stat
          href="/jobs-scraper"
          icon={Briefcase01Icon}
          label="Last job scan"
          value={
            jobs?.lastScannedAt
              ? lastScanned.format(new Date(jobs.lastScannedAt))
              : "Never"
          }
          hint={
            jobs?.lastScannedAt
              ? "Run a scan to refresh"
              : "Run your first scan"
          }
        />
        <Stat
          href="/career-profile"
          icon={UserAccountIcon}
          label="Career profile"
          value={career ? `${career.experiences.length} roles` : "Empty"}
          hint={
            career
              ? `${career.projects.length} projects, ${skillCount} skills, ${bulletCount} bullets`
              : "Fill it in to use the resume tools"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Recent transactions</h2>
          {/* flex-1 makes the two cards match height; content-start keeps short
              lists packed at the top instead of spread down the card. */}
          <Card className="flex-1">
            <CardContent className="grid content-start gap-3">
              {transactions?.items.length ? (
                transactions.items.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex min-w-0 items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {transaction.label.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.wallet.name} ·{" "}
                        {formatTransactionDate(transaction.occurredAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-medium",
                        amountClassName(transaction.type),
                      )}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No transactions yet.{" "}
                  <Link
                    className="text-primary underline underline-offset-4"
                    href="/finance-tracker"
                  >
                    Add one
                  </Link>
                </p>
              )}
            </CardContent>
            {/* mt-auto pins the action to the bottom, so both cards' buttons
                line up however long their lists are. */}
            <CardFooter className="mt-auto border-t">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/finance-tracker/transactions" />}
              >
                View more transactions
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">New job matches</h2>
          <Card className="flex-1">
            <CardContent className="grid content-start gap-3">
              {jobs?.jobs.filter((job) => job.isNew).length ? (
                jobs.jobs
                  .filter((job) => job.isNew)
                  .slice(0, 5)
                  .map((job) => (
                    <div key={job.id} className="grid min-w-0 gap-0.5">
                      <p className="truncate text-sm font-medium">
                        {job.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.company} · {job.location}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing new.{" "}
                  <Link
                    className="text-primary underline underline-offset-4"
                    href="/jobs-scraper"
                  >
                    Run a scan
                  </Link>
                </p>
              )}
            </CardContent>
            <CardFooter className="mt-auto border-t">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/jobs-scraper/review" />}
              >
                View more jobs
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium">Jump back in</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Shortcut
            href="/resume/resume-tailor"
            icon={FilePenIcon}
            title="Tailor a resume"
            description="Match your profile against a job description."
          />
          <Shortcut
            href="/career-profile"
            icon={UserAccountIcon}
            title="Career profile"
            description="Keep your roles, projects, and skills current."
          />
          <Shortcut
            href="/finance-tracker"
            icon={Wallet01Icon}
            title="Log a transaction"
            description="Record income and expenses across wallets."
          />
        </div>
      </section>
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
  icon: HugeiconsIconProps["icon"];
  label: string;
  value: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card
        size="sm"
        className="h-full transition-colors group-hover:bg-muted/40"
      >
        <CardContent className="grid min-w-0 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
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

function Shortcut({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: HugeiconsIconProps["icon"];
  title: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:bg-muted/40">
        <CardContent className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
            <HugeiconsIcon icon={icon} strokeWidth={2} />
          </div>
          <div className="grid min-w-0 gap-1">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
