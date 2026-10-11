"use client";

import { useWatch } from "react-hook-form";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";

export function useAvailableSkills() {
  return useWatch<
    CareerProfileValues,
    "skillGroups",
    CareerProfileValues,
    string[]
  >({
    name: "skillGroups",
    compute: (groups) => [
      ...new Map(
        groups
          .flatMap((group) => group.skills)
          .map((skill) => [skill.toLocaleLowerCase(), skill]),
      ).values(),
    ],
  });
}
