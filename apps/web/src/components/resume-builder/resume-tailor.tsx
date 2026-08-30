"use client";

import { useMemo, useState } from "react";

import {
  CareerProfileFallback,
  ResumePdfPreview,
} from "@/components/resume-builder/resume-pdf-preview";
import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCareerProfile } from "@/hooks/use-career-profile";
import { useResumeBuilder } from "@/hooks/use-resume-builder";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { applyTailoredResume } from "@/lib/resume";

export function ResumeTailor() {
  const [jobRequirement, setJobRequirement] = useState("");
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const { careerProfile, isError, isLoading, refetch } = useCareerProfile();
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

  if (isError || (!isLoading && !careerProfile)) {
    return (
      <CareerProfileFallback isError={isError} onRetry={() => refetch()} />
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 xl:flex-row">
      <aside className="grid w-full shrink-0 gap-4 rounded-md border bg-card p-4 xl:sticky xl:top-6 xl:w-80">
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
          {buildResume.isPending ? "Tailoring..." : "Tailor Resume"}
        </Button>
        {buildResume.isError && (
          <p className="text-sm text-destructive">
            {buildResume.error.message}
          </p>
        )}
      </aside>
      <ResumePdfPreview
        isLoading={isLoading || buildResume.isPending}
        profile={resumeProfile}
      />
    </div>
  );
}
