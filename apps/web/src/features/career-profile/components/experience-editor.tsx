"use client";

import { useWatch } from "react-hook-form";
import {
  CurrentField,
  CareerProfileField as Field,
  SkillsField,
} from "@/features/career-profile/components/career-profile-field";
import { BulletsField } from "@/features/career-profile/components/bullets-field";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";

export function ExperienceEditor({ index }: { index: number }) {
  const name = `experiences.${index}` as const;
  const isCurrent = useWatch<CareerProfileValues>({
    name: `${name}.isCurrent`,
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Job title"
          name={`${name}.jobTitle`}
          placeholder="Software Engineer"
          required
        />
        <Field
          label="Company name"
          name={`${name}.companyName`}
          placeholder="Acme Inc."
          required
        />
        <Field
          label="Employment type"
          name={`${name}.employmentType`}
          placeholder="Full-time"
          optional
        />
        <Field
          label="Location"
          name={`${name}.location`}
          variant="location"
          placeholder="Makati, Philippines"
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
      <CurrentField label="I currently work here" name={`${name}.isCurrent`} />
      <SkillsField
        ariaLabel={`Skills for experience ${index + 1}`}
        name={`${name}.skills`}
        placeholder="Pick from your skill groups"
        restricted
      />
      <BulletsField
        itemLabel={`Experience ${index + 1}`}
        name={`${name}.bullets`}
      />
    </>
  );
}
