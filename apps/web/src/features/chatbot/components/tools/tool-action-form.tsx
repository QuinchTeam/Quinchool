"use client";

import { type FormEvent, useState } from "react";

import { ToolFormFields } from "@/features/chatbot/components/tools/tool-form-fields";
import type { ToolActionProps } from "@/features/chatbot/components/tools/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

/**
 * The default renderer for a pending write. Works for any domain because the
 * API describes its own fields; a domain only needs its own component when the
 * plain field list is not enough.
 */
export function ToolActionForm({
  action,
  error,
  isPending,
  onDismiss,
  onSubmit,
}: ToolActionProps) {
  const [values, setValues] = useState(action.values);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <h3 className="font-medium">{action.title}</h3>
          {action.description ? (
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
          ) : null}
        </CardHeader>
        {action.fields.length > 0 ? (
          <CardContent>
            <ToolFormFields
              fields={action.fields}
              values={values}
              onChange={(name, value) =>
                setValues((current) => ({ ...current, [name]: value }))
              }
            />
          </CardContent>
        ) : null}
        {error ? (
          <CardContent>
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          </CardContent>
        ) : null}
        <CardFooter>
          <Button
            type="submit"
            variant={action.destructive ? "destructive" : "default"}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : null}
            {action.submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={onDismiss}
          >
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
