"use client";

import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { ProhibitIcon } from "@phosphor-icons/react/dist/ssr/Prohibit";

import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/features/jobs-scraper/components/shared/section-card";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import {
  formatLocationModes,
  formatTimeRange,
} from "@/features/jobs-scraper/lib/criteria";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

export function JobsScraperCriteria() {
  const { state } = useJobsScraper();

  return (
    <SectionCard icon={FunnelIcon} title="Search criteria">
      {state ? <CriteriaSummary config={state.config} /> : <CriteriaLoading />}
    </SectionCard>
  );
}

function CriteriaSummary({ config }: { config: JobScraperConfig }) {
  return (
    <>
      <CriteriaGroup label="Posted" items={[formatTimeRange(config)]} />
      <CriteriaGroup label="Location" items={formatLocationModes(config)} />
      <CriteriaGroup label="Roles" items={config.roles} />
      <CriteriaGroup label="Levels" items={config.includedLevels} />
      <CriteriaGroup
        label="Required stack"
        items={config.requiredTechnologies}
      />
      <CriteriaGroup
        label="Excluded levels"
        items={config.excludedLevels}
        destructive
      />
      <CriteriaGroup
        label="Excluded"
        items={config.excludedTechnologies}
        destructive
      />
      <div className="border-t pt-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Sources
        </p>
        <div className="flex flex-wrap gap-2">
          {config.sources.map((source) => (
            <Badge key={source} variant="outline">
              {source}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

function CriteriaGroup({
  destructive = false,
  items,
  label,
}: {
  destructive?: boolean;
  items: readonly string[];
  label: string;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant={destructive ? "destructive" : "secondary"}
            >
              {item}
            </Badge>
          ))
        ) : (
          <Badge variant="outline">
            <AppIcon icon={ProhibitIcon} data-icon="inline-start" />
            None
          </Badge>
        )}
      </div>
    </div>
  );
}

function CriteriaLoading() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </div>
  );
}
