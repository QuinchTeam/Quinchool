"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { apiUrl, readApiData, withCredentials } from "@/lib/api";
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

    return readApiData<CareerProfileValues | null>(
      response,
      "Career profile request failed",
    );
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
    error: query.error,
    refetch: query.refetch,
    saveCareerProfile,
  };
}
