"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { CodeIcon } from "@phosphor-icons/react/dist/ssr/Code";
import { useFormContext } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StringListInput } from "@/features/career-profile/components/string-list-input";
import { SectionCard } from "@/features/jobs-scraper/components/shared/section-card";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

export function RolesSection() {
  return (
    <SectionCard
      icon={BriefcaseIcon}
      title="Roles"
      description="Job titles to look for."
    >
      <CriteriaField
        name="roles"
        label="Roles"
        placeholder="Frontend Developer"
      />
    </SectionCard>
  );
}

export function LevelsSection() {
  return (
    <SectionCard
      icon={ChartLineUpIcon}
      title="Levels"
      description="Seniority to keep or skip."
    >
      <CriteriaField
        name="includedLevels"
        label="Included"
        placeholder="Junior, Mid"
      />
      <CriteriaField
        name="excludedLevels"
        label="Excluded"
        placeholder="Senior, Lead"
      />
    </SectionCard>
  );
}

export function TechnologiesSection() {
  return (
    <SectionCard
      icon={CodeIcon}
      title="Technologies"
      description="Stack a listing must mention, or must not."
    >
      <CriteriaField
        name="requiredTechnologies"
        label="Required"
        placeholder="React, TypeScript"
      />
      <CriteriaField
        name="excludedTechnologies"
        label="Excluded"
        placeholder="PHP"
      />
    </SectionCard>
  );
}

function CriteriaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name:
    | "excludedLevels"
    | "excludedTechnologies"
    | "includedLevels"
    | "requiredTechnologies"
    | "roles";
  placeholder: string;
}) {
  const { control } = useFormContext<JobScraperConfig>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <StringListInput
            ariaLabel={label}
            placeholder={`${placeholder} — press Enter to add`}
            invalid={Boolean(fieldState.error)}
            value={field.value}
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
