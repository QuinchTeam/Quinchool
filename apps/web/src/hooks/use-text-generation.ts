"use client";

import { useMutation } from "@tanstack/react-query";

import { generateText } from "@/features/node-based-builder/lib/flow-actions";

export function useTextGeneration() {
  return useMutation({ mutationFn: generateText });
}
