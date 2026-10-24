"use client";

import { useWatch } from "react-hook-form";
import {
  CurrentField,
  CareerProfileField as Field,
  SkillsField,
} from "@/features/career-profile/components/career-profile-field";
import { BulletsField } from "@/features/career-profile/components/bullets-field";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";

export function ProjectEditor({ index }: { index: number }) {
  const name = `projects.${index}` as const;
  const isCurrent = useWatch<CareerProfileValues>({
    name: `${name}.isCurrent`,
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Project name"
          name={`${name}.projectName`}
          placeholder="Personal finance tracker"
          required
        />
        <Field
          label="Start date"
          name={`${name}.startDate`}
          variant="date"
          type="month"
          required
        />
        <Field
          label="End date"
          name={`${name}.endDate`}
          variant="date"
          type="month"
          disabled={Boolean(isCurrent)}
          required={!isCurrent}
          optional
        />
      </div>
      <CurrentField
        label="This project is ongoing"
        name={`${name}.isCurrent`}
      />
      <SkillsField
        ariaLabel={`Skills for project ${index + 1}`}
        name={`${name}.skills`}
        placeholder="Pick from your skill groups"
        restricted
      />
      <BulletsField
        itemLabel={`Project ${index + 1}`}
        name={`${name}.bullets`}
      />
    </>
  );
}
