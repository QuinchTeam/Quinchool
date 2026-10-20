"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiUrl, readApiData, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

export interface ResumeLayout {
  excluded: string[];
  order: Record<string, number[]>;
}

const RESUME_LAYOUT_KEY = ["career-profile", "resume-layout"] as const;

function requestResumeLayout(init?: RequestInit): Promise<ResumeLayout> {
  return observeOperation("resume-layout.request", async () => {
    const response = await apiFetch(apiUrl("/career-profile/resume-layout"), {
      ...withCredentials,
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    return readApiData<ResumeLayout>(response, "Resume layout request failed");
  });
}

export function useResumeLayout() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: RESUME_LAYOUT_KEY,
    queryFn: () => requestResumeLayout(),
  });
  const save = useMutation({
    mutationFn: (layout: ResumeLayout) =>
      requestResumeLayout({ method: "PUT", body: JSON.stringify(layout) }),
    onSuccess: (layout) => queryClient.setQueryData(RESUME_LAYOUT_KEY, layout),
    onError: (error) => toast.error(error.message),
  });

  return { layout: query.data, isLoading: query.isLoading, save: save.mutate };
}
