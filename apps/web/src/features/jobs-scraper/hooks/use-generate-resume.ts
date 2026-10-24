"use client";

import { toast } from "sonner";

import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import type { SavedJob } from "@/features/jobs-scraper/lib/types";
import { useJobsScraperStore } from "@/features/jobs-scraper/store/jobs-scraper-store";
import { useResumeBuilder } from "@/features/resume-builder/hooks/use-resume-builder";
import { applyTailoredResume } from "@/features/resume-builder/lib/resume";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";

export function useGenerateResume() {
  const { careerProfile, isLoading } = useCareerProfile();
  const { buildResume } = useResumeBuilder(careerProfile);
  const generatingJobId = useJobsScraperStore((state) => state.generatingJobId);
  const setGeneratingJobId = useJobsScraperStore(
    (state) => state.setGeneratingJobId,
  );

  async function generateResume(job: SavedJob) {
    if (!careerProfile) {
      toast.error("Add your career profile before generating a resume.");
      return;
    }

    setGeneratingJobId(job.id);

    try {
      const tailored = await buildResume.mutateAsync({
        jobId: job.id,
        modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
      });
      const { downloadResumePdf } =
        await import("@/features/resume-builder/lib/resume-pdf");
      await downloadResumePdf(applyTailoredResume(careerProfile, tailored));
      toast.success(`Resume tailored for ${job.title} downloaded.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Resume generation failed.",
      );
    } finally {
      setGeneratingJobId(null);
    }
  }

  return {
    generateResume,
    generatingJobId,
    resumeDisabled: isLoading || generatingJobId !== null,
  };
}
