"use client";

import { Card } from "@/components/ui/card";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { GraduationCapIcon } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr/FolderSimple";
import { EmptyState } from "@/components/shared/empty-state";
import { AppIcon } from "@/components/ui/icon";
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
  DragHandle,
  SortableList,
  useSortableItem,
} from "@/components/ui/sortable";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { cn } from "@/lib/utils";

type EntryName = "educations" | "skillGroups" | "experiences" | "projects";

const titleFields = {
  educations: "institutionName",
  skillGroups: "label",
  experiences: "jobTitle",
  projects: "projectName",
} as const;

const emptyStates = {
  educations: {
    icon: GraduationCapIcon,
    description: "Add the schools and degrees you want on your resume.",
  },
  skillGroups: {
    icon: WrenchIcon,
    description: "Group your skills, like languages or frameworks.",
  },
  experiences: {
    icon: BriefcaseIcon,
    description: "Add the roles you have held, newest first.",
  },
  projects: {
    icon: FolderSimpleIcon,
    description: "Add side projects or work you want to show off.",
  },
};

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
  const { dragClassName, handleProps, itemProps } = useSortableItem(id);
  const { getFieldState } = useFormContext<CareerProfileValues>();
  const { invalid } = getFieldState(path, useFormState({ name: path }));
  const title = useWatch<CareerProfileValues>({
    name: `${path}.${titleField}` as FieldPath<CareerProfileValues>,
  });
  const open = !collapsed || invalid;

  return (
    <Card
      {...itemProps}
      variant="minimal"
      className={cn("gap-5", dragClassName)}
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
          <AppIcon icon={open ? CaretDownIcon : CaretRightIcon} />
          <span className="sr-only">
            {open ? "Collapse" : "Expand"} {label.toLowerCase()}
          </span>
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <AppIcon icon={TrashIcon} />
          <span className="sr-only">Remove {label.toLowerCase()}</span>
        </Button>
      </div>
      {/* Keep collapsed fields mounted so they stay registered with the form. */}
      <div id={bodyId} className={open ? "grid gap-5" : "hidden"}>
        {children}
      </div>
    </Card>
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
          <AppIcon icon={PlusCircleIcon} />
          {addLabel}
        </Button>
      </div>
      <SortableList
        className="grid gap-5"
        ids={fields.map((entry) => entry.id)}
        onMove={move}
      >
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
        <EmptyState
          icon={emptyStates[name].icon}
          title={`No ${title} Yet`}
          description={emptyStates[name].description}
        />
      )}
    </section>
  );
}
