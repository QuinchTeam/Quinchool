"use client";

import { useMutation } from "@tanstack/react-query";

import { enhancePrompt } from "@/features/node-based-builder/lib/flow-actions";

export function usePromptEnhancer() {
  return useMutation({ mutationFn: enhancePrompt });
}
