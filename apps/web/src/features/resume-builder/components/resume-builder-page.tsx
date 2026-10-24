"use client";

import { useEffect, useMemo, useState } from "react";

import { CareerProfileFallback } from "@/features/career-profile/components/career-profile-fallback";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { ResumeContentToolbar } from "@/features/resume-builder/components/resume-content-toolbar";
import { ResumePdfPreview } from "@/features/resume-builder/components/resume-pdf-preview";
import {
  type ResumeLayout,
  useResumeLayout,
} from "@/features/resume-builder/hooks/use-resume-layout";
import { filterResumeContent } from "@/features/resume-builder/lib/resume";
import { useResumeBuilderStore } from "@/features/resume-builder/store/resume-builder-store";

export function ResumeBuilderPage() {
  const { careerProfile, error, isLoading, refetch } = useCareerProfile();
  const resumeLayout = useResumeLayout();

  if (error || (!isLoading && !careerProfile)) {
    return <CareerProfileFallback error={error} retry={() => void refetch()} />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 xl:min-h-0 xl:flex-1 xl:flex-row">
      {careerProfile && resumeLayout.layout ? (
        <ResumeBuilder
          layout={resumeLayout.layout}
          profile={careerProfile}
          save={resumeLayout.save}
        />
      ) : (
        <ResumePdfPreview isLoading profile={null} />
      )}
    </div>
  );
}

function ResumeBuilder({
  layout,
  profile,
  save,
}: {
  layout: ResumeLayout;
  profile: CareerProfileValues;
  save: (layout: ResumeLayout) => void;
}) {
  // Load the saved layout before the toolbar first reads the store.
  useState(() => useResumeBuilderStore.getState().load(layout));
  const excluded = useResumeBuilderStore((state) => state.excluded);
  const order = useResumeBuilderStore((state) => state.order);
  const resumeProfile = useMemo(
    () => filterResumeContent(profile, excluded, order),
    [profile, excluded, order],
  );

  // Autosave only user edits; the initial load happens before this subscribes.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = useResumeBuilderStore.subscribe((state, previous) => {
      if (
        state.excluded === previous.excluded &&
        state.order === previous.order
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(
        () => save({ excluded: [...state.excluded], order: state.order }),
        600,
      );
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [save]);

  return (
    <>
      <ResumeContentToolbar profile={profile} />
      <ResumePdfPreview profile={resumeProfile} />
    </>
  );
}
