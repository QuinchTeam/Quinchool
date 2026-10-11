"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { apiUrl, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

const CAREER_PROFILE_KEY = ["career-profile"] as const;

async function fetchCareerProfile(
  input: string,
  init?: RequestInit,
): Promise<CareerProfileValues | null> {
  return observeOperation("career-profile.request", async () => {
    const response = await apiFetch(input, {
      ...withCredentials,
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      throw Object.assign(
        new Error(body?.error ?? "Career profile request failed"),
        { status: response.status },
      );
    }

    const body = await response.text();
    return body ? (JSON.parse(body) as CareerProfileValues | null) : null;
  });
}

export function useCareerProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CAREER_PROFILE_KEY,
    queryFn: () => fetchCareerProfile(apiUrl("/career-profile")),
  });
  const saveCareerProfile = useMutation({
    mutationFn: (values: CareerProfileValues) =>
      fetchCareerProfile(apiUrl("/career-profile"), {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: (careerProfile) => {
      queryClient.setQueryData(CAREER_PROFILE_KEY, careerProfile);
    },
  });

  return {
    careerProfile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    saveCareerProfile,
  };
}
