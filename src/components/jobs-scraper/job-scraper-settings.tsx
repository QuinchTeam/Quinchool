"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobsScraper } from "@/hooks/use-jobs-scraper";
import {
  getTodayInManila,
  JOB_SOURCES,
  JOB_TIME_RANGES,
  JOB_WORK_MODES,
  type JobScraperConfig,
  jobScraperConfigSchema,
} from "@/lib/jobs-scraper/schema";

type CriteriaField =
  | "roles"
  | "includedLevels"
  | "requiredTechnologies"
  | "excludedLevels"
  | "excludedTechnologies";

const TIME_RANGE_LABELS: Record<JobScraperConfig["timeRange"], string> = {
  LAST_HOUR: "Last 1 hour",
  TODAY: "Today only",
  THIS_WEEK: "This week",
  CUSTOM: "Custom range",
};

export function JobScraperSettings() {
  const { isError, isLoading, refetch, saveConfig, state } = useJobsScraper();
  const [draft, setDraft] = useState<JobScraperConfig | null>(null);
  const [message, setMessage] = useState("");
  const today = getTodayInManila();
  const earliestCustomDate = shiftDate(today, -6);

  useEffect(() => {
    if (state && !draft) {
      setDraft(structuredClone(state.config));
    }
  }, [draft, state]);

  if (isError) {
    return (
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold">Scraper settings unavailable</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </main>
    );
  }

  if (isLoading || !draft) {
    return <SettingsLoading />;
  }

  const updateCriteria = (field: CriteriaField, items: string[]) => {
    setMessage("");
    setDraft((current) => (current ? { ...current, [field]: items } : current));
  };

  const toggleWorkMode = (
    field: "worldwideWorkModes" | "philippinesWorkModes",
    mode: (typeof JOB_WORK_MODES)[number],
    checked: boolean,
  ) => {
    const modes = checked
      ? [...draft[field], mode]
      : draft[field].filter((item) => item !== mode);
    setMessage("");
    setDraft({ ...draft, [field]: [...new Set(modes)] });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const parsed = jobScraperConfigSchema.safeParse(draft);

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the configuration.");
      return;
    }

    try {
      const saved = await saveConfig.mutateAsync(parsed.data);
      setDraft(structuredClone(saved.config));
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Settings could not be saved.",
      );
    }
  }

  return (
    <main className="min-h-full bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2">
            <Link
              href="/jobs-scraper"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              Jobs scraper
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Scraper settings</h1>
              <p className="text-sm text-muted-foreground">
                Criteria are private to your account and apply to the next scan.
              </p>
            </div>
          </div>
          <Button
            type="submit"
            form="job-scraper-settings"
            disabled={saveConfig.isPending}
          >
            <HugeiconsIcon icon={SaveIcon} strokeWidth={2} />
            {saveConfig.isPending ? "Saving" : "Save settings"}
          </Button>
        </div>
      </header>

      <form
        id="job-scraper-settings"
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl px-4 sm:px-6"
      >
        <SettingsSection
          title="Time window"
          description="Custom ranges can include at most seven calendar days."
        >
          <div className="grid max-w-md gap-3">
            <Label htmlFor="time-range">Posted</Label>
            <Select
              value={draft.timeRange}
              onValueChange={(value) => {
                if (value) {
                  setMessage("");
                  setDraft({ ...draft, timeRange: value });
                }
              }}
            >
              <SelectTrigger id="time-range" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TIME_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>
                    {TIME_RANGE_LABELS[range]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {draft.timeRange === "CUSTOM" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="custom-start-date">Start date</Label>
                  <Input
                    id="custom-start-date"
                    type="date"
                    min={earliestCustomDate}
                    max={today}
                    value={draft.customStartDate ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        customStartDate: event.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custom-end-date">End date</Label>
                  <Input
                    id="custom-end-date"
                    type="date"
                    min={earliestCustomDate}
                    max={today}
                    value={draft.customEndDate ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        customEndDate: event.target.value || null,
                      })
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Locations and work modes"
          description="Worldwide modes apply to every country. Philippines modes add local options."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <WorkModeGroup
              label="Worldwide"
              values={draft.worldwideWorkModes}
              onChange={(mode, checked) =>
                toggleWorkMode("worldwideWorkModes", mode, checked)
              }
            />
            <WorkModeGroup
              label="Philippines"
              values={draft.philippinesWorkModes}
              onChange={(mode, checked) =>
                toggleWorkMode("philippinesWorkModes", mode, checked)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Sources">
          <div className="flex flex-wrap gap-6">
            {JOB_SOURCES.map((source) => (
              <Label key={source}>
                <Checkbox
                  checked={draft.sources.includes(source)}
                  onCheckedChange={(checked) => {
                    const sources = checked
                      ? [...draft.sources, source]
                      : draft.sources.filter((item) => item !== source);
                    setMessage("");
                    setDraft({ ...draft, sources: [...new Set(sources)] });
                  }}
                />
                {source}
              </Label>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Roles">
          <EditableCriteria
            label="Role"
            items={draft.roles}
            required
            onChange={(items) => updateCriteria("roles", items)}
          />
        </SettingsSection>

        <SettingsSection title="Levels">
          <EditableCriteria
            label="Included level"
            items={draft.includedLevels}
            required
            onChange={(items) => updateCriteria("includedLevels", items)}
          />
          <EditableCriteria
            label="Excluded level"
            items={draft.excludedLevels}
            onChange={(items) => updateCriteria("excludedLevels", items)}
          />
        </SettingsSection>

        <SettingsSection title="Technologies">
          <EditableCriteria
            label="Required technology"
            items={draft.requiredTechnologies}
            onChange={(items) => updateCriteria("requiredTechnologies", items)}
          />
          <EditableCriteria
            label="Excluded technology"
            items={draft.excludedTechnologies}
            onChange={(items) => updateCriteria("excludedTechnologies", items)}
          />
        </SettingsSection>

        <div className="flex min-h-20 items-center justify-between gap-4 py-5">
          <p
            className={
              message === "Settings saved."
                ? "text-sm text-primary"
                : "text-sm text-destructive"
            }
          >
            {message}
          </p>
          <Button type="submit" disabled={saveConfig.isPending}>
            <HugeiconsIcon icon={SaveIcon} strokeWidth={2} />
            Save settings
          </Button>
        </div>
      </form>
    </main>
  );
}

function SettingsSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="grid gap-5 border-b py-7 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-6 md:col-span-2">{children}</div>
    </section>
  );
}

function WorkModeGroup({
  label,
  onChange,
  values,
}: {
  label: string;
  onChange: (mode: (typeof JOB_WORK_MODES)[number], checked: boolean) => void;
  values: JobScraperConfig["worldwideWorkModes"];
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">{label}</legend>
      {JOB_WORK_MODES.map((mode) => (
        <Label key={mode}>
          <Checkbox
            checked={values.includes(mode)}
            onCheckedChange={(checked) => onChange(mode, checked)}
          />
          {mode}
        </Label>
      ))}
    </fieldset>
  );
}

function EditableCriteria({
  items,
  label,
  onChange,
  required = false,
}: {
  items: string[];
  label: string;
  onChange: (items: string[]) => void;
  required?: boolean;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const value = newItem.trim();

    if (
      !value ||
      items.some((item) => item.toLowerCase() === value.toLowerCase())
    ) {
      return;
    }

    onChange([...items, value]);
    setNewItem("");
  };

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: controlled criteria have no persisted item IDs
            key={index}
            className="flex gap-2"
          >
            <Input
              aria-label={`${label} ${index + 1}`}
              value={item}
              onChange={(event) =>
                onChange(
                  items.map((current, itemIndex) =>
                    itemIndex === index ? event.target.value : current,
                  ),
                )
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove ${item}`}
              title={`Remove ${item}`}
              disabled={required && items.length === 1}
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          aria-label={`New ${label.toLowerCase()}`}
          placeholder={`Add ${label.toLowerCase()}`}
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addItem}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add
        </Button>
      </div>
    </fieldset>
  );
}

function SettingsLoading() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-4 border-b pb-8 md:grid-cols-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full md:col-span-2" />
        </div>
      ))}
    </main>
  );
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
