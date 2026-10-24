"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/lib/auth-client";
import {
  type ProfileNameValues,
  profileNameSchema,
} from "@/features/auth/validations/auth";

// better-auth provides update-user; no custom API route is needed.
export function NameEditor({
  email,
  name,
  onSaved,
}: {
  email: string;
  name: string;
  onSaved: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    values: { name },
  });

  async function onSubmit(values: ProfileNameValues) {
    const { error } = await updateUser({ name: values.name });

    if (error) {
      toast.error(error.message ?? "Could not update your name");
      return;
    }
    toast.success("Name updated");
    setIsEditing(false);
    onSaved();
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-lg font-semibold">{name}</p>
          <p className="break-all text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit name
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-w-0 flex-1 flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset({ name });
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
