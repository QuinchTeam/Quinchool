"use client";

import { useMutation } from "@tanstack/react-query";

import { enhancePrompt } from "@/lib/node-based-builder/flow-actions";

export function usePromptEnhancer() {
  return useMutation({ mutationFn: enhancePrompt });
}
