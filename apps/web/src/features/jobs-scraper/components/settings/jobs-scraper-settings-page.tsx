"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AppHeader } from "@/components/shared/app-header";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LevelsSection,
  RolesSection,
  TechnologiesSection,
} from "@/features/jobs-scraper/components/settings/criteria-sections";
import { LocationsSection } from "@/features/jobs-scraper/components/settings/locations-section";
import { SourcesSection } from "@/features/jobs-scraper/components/settings/sources-section";
import { TimeWindowSection } from "@/features/jobs-scraper/components/settings/time-window-section";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { getUnsetScanCriteria } from "@/features/jobs-scraper/lib/criteria";
import {
  type JobScraperConfig,
  jobScraperConfigSchema,
} from "@/features/jobs-scraper/validations/job-scraper-config";

const FORM_ID = "job-scraper-settings";

export function JobsScraperSettingsPage() {
  const { error, isLoading, refetch, saveConfig, state } = useJobsScraper();
  const form = useForm<JobScraperConfig>({
    resolver: zodResolver(jobScraperConfigSchema),
    values: state?.config,
  });

  async function save(config: JobScraperConfig) {
    try {
      const saved = await saveConfig.mutateAsync(config);
      const unset = getUnsetScanCriteria(saved.config);
      toast.success("Settings saved", {
        description:
          unset.length > 0
            ? `Add ${unset.join(", ")} before a scan can run.`
            : undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Settings could not be saved.",
      );
    }
  }

  return (
    <main className="min-h-full">
      <div className="px-6 pt-6">
        <AppHeader
          icon={SlidersHorizontalIcon}
          title="Scraper Settings"
          description="Criteria are private to your account and apply to the next scan."
        >
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/jobs-scraper" />}
          >
            <AppIcon icon={CaretLeftIcon} />
            Back to jobs
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={!state || !form.formState.isDirty || saveConfig.isPending}
          >
            <AppIcon icon={FloppyDiskIcon} />
            {saveConfig.isPending ? "Saving" : "Save settings"}
          </Button>
        </AppHeader>
      </div>

      <div className="px-6 py-6">
        {error ? (
          <ErrorState error={error} retry={() => void refetch()} />
        ) : isLoading || !state ? (
          <SettingsLoading />
        ) : (
          <Form {...form}>
            <form
              id={FORM_ID}
              noValidate
              onSubmit={form.handleSubmit(save, (errors) =>
                toast.error("Review the settings", {
                  description: Object.values(errors)[0]?.message,
                }),
              )}
              className="grid gap-6 lg:grid-cols-2"
            >
              <TimeWindowSection />
              <SourcesSection />
              <LocationsSection />
              <RolesSection />
              <LevelsSection />
              <TechnologiesSection />
            </form>
          </Form>
        )}
      </div>
    </main>
  );
}

function SettingsLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-48 w-full" />
      ))}
    </div>
  );
}
