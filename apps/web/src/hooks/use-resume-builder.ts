"use client";

import { useMutation } from "@tanstack/react-query";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, withCredentials } from "@/lib/api";
import { applyTailoredResume, type TailoredResume } from "@/lib/resume";
import type { CareerProfileValues } from "@/lib/validations/career-profile";

export interface BuildResumeInput {
  jobId?: string;
  jobRequirement?: string;
  modelId: TextGenerationModelId;
}

const MAX_FIT_ATTEMPTS = 4;
const MIN_FILL_RATIO = 0.82;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...withCredentials,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(body?.error ?? "Resume tailoring request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function useResumeBuilder(careerProfile?: CareerProfileValues | null) {
  const buildResume = useMutation({
    mutationFn: async (input: BuildResumeInput) => {
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
          apiUrl("/build-resume"),
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

        const { renderResumePdf } = await import(
          "@/components/resume-builder/resume-pdf-preview"
        );
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
    },
  });

  return {
    buildResume,
  };
}
