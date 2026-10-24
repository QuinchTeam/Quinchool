"use client";

import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/features/jobs-scraper/components/shared/section-card";
import {
  JOB_TIME_RANGE_LABELS,
  JOB_TIME_RANGES,
} from "@/features/jobs-scraper/lib/constants";
import { getTodayInManila, shiftDate } from "@/features/jobs-scraper/lib/date";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

export function TimeWindowSection() {
  const { control } = useFormContext<JobScraperConfig>();
  const timeRange = useWatch({ control, name: "timeRange" });
  const today = getTodayInManila();
  const earliestDate = shiftDate(today, -6);

  return (
    <SectionCard
      icon={ClockIcon}
      title="Time window"
      description="Custom ranges can include at most seven calendar days."
    >
      <FormField
        control={control}
        name="timeRange"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Posted</FormLabel>
            <Select
              value={field.value}
              items={JOB_TIME_RANGE_LABELS}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {JOB_TIME_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>
                    {JOB_TIME_RANGE_LABELS[range]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      {timeRange === "CUSTOM" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["customStartDate", "Start date"],
              ["customEndDate", "End date"],
            ] as const
          ).map(([name, label]) => (
            <FormField
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={earliestDate}
                      max={today}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
