"use client";

import { useMutation } from "@tanstack/react-query";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import {
  applyTailoredResume,
  type TailoredResume,
} from "@/features/resume-builder/lib/resume";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, readApiData, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

export interface BuildResumeInput {
  jobId?: string;
  jobRequirement?: string;
  modelId: TextGenerationModelId;
}

const MAX_FIT_ATTEMPTS = 4;
const MIN_FILL_RATIO = 0.82;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(input, {
    ...withCredentials,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  return readApiData<T>(response, "Resume tailoring request failed");
}

export function useResumeBuilder(careerProfile?: CareerProfileValues | null) {
  const buildResume = useMutation({
    mutationFn: (input: BuildResumeInput) =>
      observeOperation("resume-builder.tailor", async () => {
        const candidates: {
          fillRatio: number;
          pageCount: number;
          tailored: TailoredResume;
        }[] = [];
        let previousResume: TailoredResume | undefined;
        let fit: "expand" | "reduce" | undefined;
        let renderedFillRatio: number | undefined;
        let renderedPageCount: number | undefined;

        for (let attempt = 0; attempt < MAX_FIT_ATTEMPTS; attempt += 1) {
          const tailored = await fetchJson<TailoredResume>(
            apiUrl("/build-resume/tailored-resumes"),
            {
              method: "POST",
              body: JSON.stringify({
                ...input,
                fit,
                previousResume,
                renderedFillRatio,
                renderedPageCount,
              }),
            },
          );

          if (!careerProfile) return tailored;

          const { renderResumePdf } =
            await import("@/features/resume-builder/lib/resume-pdf");
          const { fillRatio, pageCount } = await renderResumePdf(
            applyTailoredResume(careerProfile, tailored),
          );
          candidates.push({ fillRatio, pageCount, tailored });

          if (pageCount === 1 && fillRatio >= MIN_FILL_RATIO) {
            return tailored;
          }

          fit = pageCount > 1 ? "reduce" : "expand";
          previousResume = tailored;
          renderedFillRatio = fillRatio;
          renderedPageCount = pageCount;
        }

        return (
          candidates
            .filter((candidate) => candidate.pageCount === 1)
            .sort((left, right) => right.fillRatio - left.fillRatio)[0] ??
          candidates.sort((left, right) => left.pageCount - right.pageCount)[0]
        ).tailored;
      }),
  });

  return {
    buildResume,
  };
}
