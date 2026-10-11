"use client";

import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, useId } from "react";
import {
  type FieldPathByValue,
  useController,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StringListInput } from "@/features/career-profile/components/string-list-input";
import { useAvailableSkills } from "@/features/career-profile/hooks/use-available-skills";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";

type Values = CareerProfileValues;
type BulletsPath = `${"experiences" | "projects"}.${number}.bullets`;

function FieldError({ id, message }: { id?: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function CareerProfileField({
  label,
  multiline = false,
  name,
  optional = false,
  ...props
}: Pick<
  ComponentProps<"input">,
  | "aria-label"
  | "autoComplete"
  | "disabled"
  | "inputMode"
  | "placeholder"
  | "required"
  | "type"
> & {
  label: string;
  multiline?: boolean;
  name: FieldPathByValue<Values, string>;
  optional?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const { field, fieldState } = useController<Values>({ name });
  const control = {
    ...field,
    ...props,
    id,
    value: (field.value as string | undefined) ?? "",
    "aria-invalid": fieldState.invalid || undefined,
    "aria-describedby": fieldState.error ? errorId : undefined,
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </Label>
      {multiline ? <Textarea {...control} /> : <Input {...control} />}
      <FieldError id={errorId} message={fieldState.error?.message} />
    </div>
  );
}

export function SkillsField({
  ariaLabel,
  name,
  placeholder,
  restricted = false,
}: {
  ariaLabel: string;
  name: FieldPathByValue<Values, string[]>;
  placeholder: string;
  restricted?: boolean;
}) {
  const { field, fieldState } = useController<Values>({ name });
  const availableSkills = useAvailableSkills();

  return (
    <div className="grid gap-2">
      <Label>Skills</Label>
      <StringListInput
        allowedValues={restricted ? availableSkills : undefined}
        ariaLabel={ariaLabel}
        invalid={fieldState.invalid}
        placeholder={placeholder}
        value={field.value as string[]}
        onChange={field.onChange}
      />
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

export function CurrentField({
  label,
  name,
}: {
  label: string;
  name: FieldPathByValue<Values, boolean>;
}) {
  const id = useId();
  const { field } = useController<Values>({ name });

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={field.value as boolean}
        onCheckedChange={field.onChange}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

export function BulletsField({
  itemLabel,
  name,
}: {
  itemLabel: string;
  name: BulletsPath;
}) {
  const { append, fields, remove } = useFieldArray<Values, BulletsPath>({
    name,
  });

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Bullets</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ text: "" })}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add bullet
        </Button>
      </div>
      {fields.map((bullet, index) => (
        <div key={bullet.id} className="flex items-start gap-2">
          <div className="flex-1">
            <CareerProfileField
              aria-label={`${itemLabel} bullet ${index + 1}`}
              label={`Bullet ${index + 1}`}
              multiline
              name={`${name}.${index}.text`}
              required
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={fields.length === 1}
            onClick={() => remove(index)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            <span className="sr-only">Remove bullet</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
