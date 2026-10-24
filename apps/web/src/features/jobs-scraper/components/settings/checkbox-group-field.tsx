"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
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
      render={({ field }) => {
        const values: string[] = field.value;

        return (
          <FormItem>
            <fieldset className="grid gap-3">
              {label ? (
                <legend className="mb-3 text-sm font-medium">{label}</legend>
              ) : null}
              {options.map((option) => (
                <Label key={option}>
                  <Checkbox
                    checked={values.includes(option)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...values, option]
                          : values.filter((value) => value !== option),
                      )
                    }
                  />
                  {option}
                </Label>
              ))}
            </fieldset>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
