"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import { emptyCareerProfile } from "@/features/career-profile/lib/empty-career-profile";
import {
  validationFieldNames,
  validationMessages,
} from "@/features/career-profile/lib/validation-errors";
import {
  type CareerProfileValues,
  careerProfileSchema,
} from "@/features/career-profile/validations/career-profile";
import { logInfo, logWarn } from "@/lib/observability/logger";

export function useCareerProfileForm() {
  const { careerProfile, error, isLoading, refetch, saveCareerProfile } =
    useCareerProfile();
  const form = useForm<CareerProfileValues>({
    resolver: zodResolver(careerProfileSchema),
    defaultValues: emptyCareerProfile(),
    // Resets the form whenever the loaded or saved profile changes.
    values: careerProfile ?? undefined,
  });

  async function save(values: CareerProfileValues) {
    try {
      await saveCareerProfile.mutateAsync(values);
      toast.success("Career profile saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save career profile",
      );
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void Sentry.startSpan(
      { name: "career-profile.save", op: "career-profile.save" },
      () => {
        logInfo("career-profile.save.attempted");
        return form.handleSubmit(save, (errors) => {
          const fields = validationFieldNames(errors);
          logWarn(
            `career-profile.save.validation-rejected errorCount=${fields.length} fields=${fields.join(",")}`,
          );
          Sentry.getActiveSpan()?.setAttribute(
            "validation.error_count",
            fields.length,
          );
          toast.error("Review the required fields", {
            description: validationMessages(errors)[0],
          });
        })(event);
      },
    );
  }

  return {
    form,
    error,
    isLoading,
    isSaving: saveCareerProfile.isPending,
    onSubmit,
    refetch,
  };
}
