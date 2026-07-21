"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

export interface ResumeBullet {
  id: string;
  companyName: string;
  experience: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumeBulletInput {
  companyName: string;
  experience: string;
}

interface BuildResumeInput {
  jobRequirement: string;
  modelId: TextGenerationModelId;
}

interface BuildResumeResult {
  text: string;
}

const RESUME_BULLETS_KEY = ["resume-bullets"] as const;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error("Resume bullet request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function useResumeBuilder() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: RESUME_BULLETS_KEY,
    queryFn: () => fetchJson<ResumeBullet[]>("/api/resume-bullets"),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: RESUME_BULLETS_KEY });

  const saveResumeBullet = useMutation({
    mutationFn: (input: ResumeBulletInput) =>
      fetchJson<ResumeBullet>("/api/resume-bullets", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });

  const updateResumeBullet = useMutation({
    mutationFn: ({ id, ...input }: ResumeBulletInput & { id: string }) =>
      fetchJson<ResumeBullet>(`/api/resume-bullets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });

  const deleteResumeBullet = useMutation({
    mutationFn: (id: string) =>
      fetchJson<void>(`/api/resume-bullets/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const buildResume = useMutation({
    mutationFn: (input: BuildResumeInput) =>
      fetchJson<BuildResumeResult>("/api/build-resume", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

  return {
    resumeBullets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    saveResumeBullet,
    updateResumeBullet,
    deleteResumeBullet,
    buildResume,
  };
}
