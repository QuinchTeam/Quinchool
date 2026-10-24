"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  useJobsScraper,
  useScanStatus,
} from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { getUnsetScanCriteria } from "@/features/jobs-scraper/lib/criteria";

export function JobsScraperHeader() {
  const { scan, state } = useJobsScraper();
  const { isScanning } = useScanStatus();
  const unsetCriteria = state ? getUnsetScanCriteria(state.config) : [];

  return (
    <AppHeader
      icon={BriefcaseIcon}
      title="Jobs Scraper"
      description="Scan job boards and save the listings that match your criteria."
    >
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/jobs-scraper/review" />}
      >
        <AppIcon icon={ListChecksIcon} />
        Review scan
        {state ? ` (${state.classificationCounts.REJECTED})` : ""}
      </Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/jobs-scraper/settings" />}
      >
        <AppIcon icon={SlidersHorizontalIcon} />
        Edit criteria
      </Button>
      <Button
        onClick={() => scan.mutate()}
        disabled={isScanning || !state || unsetCriteria.length > 0}
      >
        {isScanning ? (
          <Spinner />
        ) : (
          <AppIcon
            icon={
              state?.lastScannedAt ? ArrowClockwiseIcon : MagnifyingGlassIcon
            }
          />
        )}
        {isScanning
          ? "Scanning job boards"
          : state?.lastScannedAt
            ? "Scan again"
            : "Scan jobs"}
      </Button>
    </AppHeader>
  );
}
