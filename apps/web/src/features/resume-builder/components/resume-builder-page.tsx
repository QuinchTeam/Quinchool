"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [excluded, setExcluded] = useState(() => new Set(layout.excluded));
  const [order, setOrder] = useState<ResumeLayout["order"]>(layout.order);
  const resumeProfile = useMemo(
    () => filterResumeContent(profile, excluded, order),
    [profile, excluded, order],
  );

  const loaded = useRef(true);
  useEffect(() => {
    if (loaded.current) {
      loaded.current = false;
      return;
    }
    const timer = setTimeout(
      () => save({ excluded: [...excluded], order }),
      600,
    );
    return () => clearTimeout(timer);
  }, [excluded, order, save]);

  return (
    <>
      <ResumeContentToolbar
        excluded={excluded}
        order={order}
        profile={profile}
        setExcluded={setExcluded}
        setOrder={setOrder}
      />
      <ResumePdfPreview profile={resumeProfile} />
    </>
  );
}
