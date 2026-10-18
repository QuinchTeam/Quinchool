"use client";

import { MagicWandIcon } from "@phosphor-icons/react/dist/ssr/MagicWand";
import { useMemo, useState } from "react";

import { CareerProfileFallback } from "@/features/career-profile/components/career-profile-fallback";
import { ResumePdfPreview } from "@/features/resume-builder/components/resume-pdf-preview";
import { TextModelSelector } from "@/components/shared/text-model-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import { useResumeBuilder } from "@/features/resume-builder/hooks/use-resume-builder";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { applyTailoredResume } from "@/features/resume-builder/lib/resume";

export function ResumeTailor() {
  const [jobRequirement, setJobRequirement] = useState("");
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const { careerProfile, error, isLoading, refetch } = useCareerProfile();
  const { buildResume } = useResumeBuilder(careerProfile);
  // Until a tailored result comes back this renders the personal details,
  // education and skill-group labels only — bullets and skills stay empty.
  const resumeProfile = useMemo(
    () =>
      careerProfile
        ? applyTailoredResume(careerProfile, buildResume.data)
        : null,
    [buildResume.data, careerProfile],
  );

  if (error || (!isLoading && !careerProfile)) {
    return <CareerProfileFallback error={error} retry={() => void refetch()} />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 xl:min-h-0 xl:flex-1 xl:flex-row">
      <Card variant="minimal" className="w-full shrink-0 gap-4 xl:w-md">
        <h2 className="font-semibold">Tailor to a job</h2>
        <TextModelSelector
          label="Model"
          value={modelId}
          onValueChange={setModelId}
        />
        <div className="grid gap-2">
          <Label htmlFor="job-requirements">Job Requirements</Label>
          <Textarea
            id="job-requirements"
            className="min-h-64"
            placeholder="Paste the job description here."
            value={jobRequirement}
            onChange={(event) => setJobRequirement(event.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={!jobRequirement.trim() || buildResume.isPending}
          onClick={() =>
            buildResume.mutate({
              jobRequirement: jobRequirement.trim(),
              modelId,
            })
          }
        >
          <AppIcon icon={MagicWandIcon} />
          {buildResume.isPending ? "Tailoring..." : "Tailor Resume"}
        </Button>
        {buildResume.isError && (
          <p className="text-sm text-destructive">
            {buildResume.error.message}
          </p>
        )}
      </Card>
      <ResumePdfPreview
        isLoading={isLoading || buildResume.isPending}
        profile={resumeProfile}
      />
    </div>
  );
}
