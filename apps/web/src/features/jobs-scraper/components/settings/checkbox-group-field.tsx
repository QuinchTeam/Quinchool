"use client";

import { useFormContext } from "react-hook-form";

import {
  CheckboxGroup,
  CheckboxGroupItem,
} from "@/components/ui/checkbox-group";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

export function CheckboxGroupField({
  label,
  name,
  options,
}: {
  label?: string;
  name: "philippinesWorkModes" | "sources" | "worldwideWorkModes";
  options: readonly string[];
}) {
  const { control } = useFormContext<JobScraperConfig>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <fieldset>
            {label ? (
              <legend className="mb-3 text-sm font-medium">{label}</legend>
            ) : null}
            <CheckboxGroup
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
            >
              {options.map((option) => (
                <CheckboxGroupItem key={option} value={option}>
                  {option}
                </CheckboxGroupItem>
              ))}
            </CheckboxGroup>
          </fieldset>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
