"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { AppIcon } from "@/components/ui/icon";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ToolField } from "@/features/chatbot/lib/types";

export function ToolFormFields({
  fields,
  onChange,
  values,
}: {
  fields: ToolField[];
  onChange: (name: string, value: unknown) => void;
  values: Record<string, unknown>;
}) {
  const prefix = useId();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${prefix}-${field.name}`;
        const span = field.type === "list" || field.type === "textarea";

        return (
          <div
            key={field.name}
            className={span ? "grid gap-2 sm:col-span-2" : "grid gap-2"}
          >
            {field.type === "checkbox" ? null : (
              <Label htmlFor={id}>{field.label}</Label>
            )}
            <ToolFormField
              field={field}
              id={id}
              onChange={onChange}
              value={values[field.name]}
            />
          </div>
        );
      })}
    </div>
  );
}

function ToolFormField({
  field,
  id,
  onChange,
  value,
}: {
  field: ToolField;
  id: string;
  onChange: (name: string, value: unknown) => void;
  value: unknown;
}) {
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(field.name, checked)}
        />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        id={id}
        value={asText(value)}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.type === "list") {
    return (
      <ToolListField
        field={field}
        id={id}
        onChange={onChange}
        value={asList(value)}
      />
    );
  }

  return (
    <Input
      id={id}
      type={field.type === "month" ? "month" : field.type}
      required={field.required}
      value={asText(value)}
      placeholder={field.placeholder}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

function ToolListField({
  field,
  id,
  onChange,
  value,
}: {
  field: ToolField;
  id: string;
  onChange: (name: string, value: unknown) => void;
  value: string[];
}) {
  const rows = value.length > 0 ? value : [""];

  function update(index: number, next: string) {
    onChange(
      field.name,
      rows.map((row, at) => (at === index ? next : row)),
    );
  }

  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
          key={`${field.name}-${index}`}
          className="flex items-center gap-2"
        >
          <Input
            id={index === 0 ? id : undefined}
            aria-label={`${field.itemLabel ?? field.label} ${index + 1}`}
            value={row}
            onChange={(event) => update(index, event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${field.itemLabel ?? field.label} ${index + 1}`}
            disabled={rows.length === 1 && !row}
            onClick={() =>
              onChange(
                field.name,
                rows.filter((_row, at) => at !== index),
              )
            }
          >
            <AppIcon icon={TrashIcon} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange(field.name, [...rows, ""])}
      >
        <AppIcon icon={PlusIcon} />
        Add {field.itemLabel ?? field.label}
      </Button>
    </div>
  );
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")) : [];
}
