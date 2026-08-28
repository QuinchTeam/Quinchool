"use client";

import { useMutation } from "@tanstack/react-query";

import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import type { TailoredResume } from "@/lib/resume";

interface BuildResumeInput {
  jobRequirement: string;
  modelId: TextGenerationModelId;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
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

export function useResumeBuilder() {
  const buildResume = useMutation({
    mutationFn: (input: BuildResumeInput) =>
      fetchJson<TailoredResume>("/api/build-resume", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

  return {
    buildResume,
  };
}
