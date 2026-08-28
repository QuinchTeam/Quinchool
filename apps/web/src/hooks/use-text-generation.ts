"use client";

import { useMutation } from "@tanstack/react-query";

import { generateText } from "@/lib/node-based-builder/flow-actions";

export function useTextGeneration() {
  return useMutation({ mutationFn: generateText });
}
