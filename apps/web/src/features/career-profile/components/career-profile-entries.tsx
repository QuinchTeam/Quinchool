"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useId, useState } from "react";
import {
  type FieldArray,
  type FieldPath,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  BulletsField,
  CurrentField,
  CareerProfileField as Field,
  SkillsField,
} from "@/features/career-profile/components/career-profile-field";
import {
  DragHandle,
  SortableList,
} from "@/features/career-profile/components/sortable-list";
import { useSortableItem } from "@/features/career-profile/hooks/use-sortable-item";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { cn } from "@/lib/utils";

type EntryName = "educations" | "skillGroups" | "experiences" | "projects";

const titleFields = {
  educations: "institutionName",
  skillGroups: "label",
  experiences: "jobTitle",
  projects: "projectName",
} as const;

function EntryCard({
  children,
  id,
  label,
  onRemove,
  path,
  titleField,
}: {
  children: ReactNode;
  id: string;
  label: string;
  onRemove: () => void;
  path: `${EntryName}.${number}`;
  titleField: string;
}) {
  const bodyId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const { handleProps, isDragging, itemProps } = useSortableItem(id);
  const { getFieldState } = useFormContext<CareerProfileValues>();
  const { invalid } = getFieldState(path, useFormState({ name: path }));
  const title = useWatch<CareerProfileValues>({
    name: `${path}.${titleField}` as FieldPath<CareerProfileValues>,
  });
  // Entries with errors stay open so their messages are never hidden.
  const open = !collapsed || invalid;

  return (
    <div
      {...itemProps}
      className={cn(
        "grid gap-5 rounded-md border p-5",
        isDragging && "relative z-10 bg-background shadow-sm",
      )}
    >
      <div className="flex items-center gap-2">
        <DragHandle label={label.toLowerCase()} {...handleProps} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {label}
          {typeof title === "string" && title && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {title}
            </span>
          )}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-controls={bodyId}
          aria-expanded={open}
          disabled={invalid}
          onClick={() => setCollapsed(!collapsed)}
        >
          <HugeiconsIcon
            icon={open ? ArrowDown01Icon : ArrowRight01Icon}
            strokeWidth={2}
          />
          <span className="sr-only">
            {open ? "Collapse" : "Expand"} {label.toLowerCase()}
          </span>
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Remove {label.toLowerCase()}</span>
        </Button>
      </div>
      {/* Hidden, not unmounted, so collapsed fields keep their registration. */}
      <div id={bodyId} className={open ? "grid gap-5" : "hidden"}>
        {children}
      </div>
    </div>
  );
}

export function EntryList({
  addLabel,
  empty,
  itemLabel,
  name,
  renderItem,
  title,
}: {
  addLabel: string;
  empty: () => FieldArray<CareerProfileValues, EntryName>;
  itemLabel: string;
  name: EntryName;
  renderItem: (index: number) => ReactNode;
  title: string;
}) {
  const { append, fields, move, remove } = useFieldArray<
    CareerProfileValues,
    EntryName
  >({ name });

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(empty())}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          {addLabel}
        </Button>
      </div>
      <SortableList ids={fields.map((entry) => entry.id)} onMove={move}>
        {fields.map((entry, index) => (
          <EntryCard
            key={entry.id}
            id={entry.id}
            label={`${itemLabel} ${index + 1}`}
            onRemove={() => remove(index)}
            path={`${name}.${index}`}
            titleField={titleFields[name]}
          >
            {renderItem(index)}
          </EntryCard>
        ))}
      </SortableList>
      {!fields.length && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No {title.toLowerCase()} added.
        </p>
      )}
    </section>
  );
}

export function EducationEditor({ index }: { index: number }) {
  const name = `educations.${index}` as const;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Institution name"
        name={`${name}.institutionName`}
        required
      />
      <Field label="Location" name={`${name}.location`} required />
      <Field label="Degree" name={`${name}.degree`} required />
      <Field label="Field of study" name={`${name}.fieldOfStudy`} required />
      <Field label="Specialization" name={`${name}.specialization`} optional />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start date"
          name={`${name}.startDate`}
          type="month"
          required
        />
        <Field
          label="End date"
          name={`${name}.endDate`}
          type="month"
          required
        />
      </div>
    </div>
  );
}

export function SkillGroupEditor({ index }: { index: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field
        label="Label"
        name={`skillGroups.${index}.label`}
        placeholder="Frontend"
        required
      />
      <div className="md:col-span-2">
        <SkillsField
          ariaLabel={`Skills for group ${index + 1}`}
          name={`skillGroups.${index}.skills`}
          placeholder="Type a skill and press Enter"
        />
      </div>
    </div>
  );
}

export function ExperienceEditor({ index }: { index: number }) {
  const name = `experiences.${index}` as const;
  const isCurrent = useWatch<CareerProfileValues>({
    name: `${name}.isCurrent`,
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Job title" name={`${name}.jobTitle`} required />
        <Field label="Company name" name={`${name}.companyName`} required />
        <Field label="Location" name={`${name}.location`} required />
        <Field
          label="Employment type"
          name={`${name}.employmentType`}
          placeholder="Full-time"
          optional
        />
        <Field
          label="Start date"
          name={`${name}.startDate`}
          type="month"
          required
        />
        <Field
          label="End date"
          name={`${name}.endDate`}
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
        placeholder="Select a profile skill"
        restricted
      />
      <BulletsField
        itemLabel={`Experience ${index + 1}`}
        name={`${name}.bullets`}
      />
    </>
  );
}

export function ProjectEditor({ index }: { index: number }) {
  const name = `projects.${index}` as const;
  const isCurrent = useWatch<CareerProfileValues>({
    name: `${name}.isCurrent`,
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Project name" name={`${name}.projectName`} required />
        <Field
          label="Start date"
          name={`${name}.startDate`}
          type="month"
          required
        />
        <Field
          label="End date"
          name={`${name}.endDate`}
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
        placeholder="Select a profile skill"
        restricted
      />
      <BulletsField
        itemLabel={`Project ${index + 1}`}
        name={`${name}.bullets`}
      />
    </>
  );
}
