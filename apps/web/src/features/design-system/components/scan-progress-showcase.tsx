"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ScanDither,
  ScanProgressCard,
  type ScanStep,
} from "@/features/jobs-scraper/components/scan-progress-card";
import type { JobScraperState } from "@/features/jobs-scraper/lib/types";
import { ShowcaseSection } from "@/features/design-system/components/showcase-section";

const STEPS: ScanStep[] = ["SEARCHING", "READING", "ANALYZING", "SAVING"];
const COUNTS: Record<ScanStep, number | null> = {
  SEARCHING: null,
  READING: 20,
  ANALYZING: 18,
  SAVING: 6,
};

// A running scan; the card only reads `scan` and `config.sources`.
function mockState(step: ScanStep): JobScraperState {
  return {
    classificationCounts: { MATCH: 0, POTENTIAL: 0, REJECTED: 0 },
    config: {
      roles: [],
      includedLevels: [],
      requiredTechnologies: [],
      excludedLevels: [],
      excludedTechnologies: [],
      sources: ["LinkedIn", "JobStreet"],
      timeRange: "TODAY",
      customStartDate: null,
      customEndDate: null,
      worldwideWorkModes: [],
      philippinesWorkModes: [],
    },
    jobs: [],
    lastScannedAt: null,
    newJobCount: 0,
    savedJobCount: 0,
    scan: {
      error: null,
      startedAt: null,
      status: "RUNNING",
      step,
      stepCount: COUNTS[step],
    },
    sourceIssues: [],
  };
}

export function ScanProgressShowcase() {
  const [step, setStep] = useState<ScanStep>("SEARCHING");

  return (
    <ShowcaseSection
      id="scan-progress"
      title="Scan Progress"
      description="Jobs scraper background scan, one dither scene per step"
      className="flex-col items-stretch gap-6"
    >
      <div className="flex flex-wrap gap-6">
        {STEPS.map((item) => (
          <div key={item} className="grid justify-items-center gap-2">
            <ScanDither step={item} />
            <span className="text-xs text-muted-foreground capitalize">
              {item.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={item === step ? "default" : "outline"}
            onClick={() => setStep(item)}
          >
            {item.charAt(0) + item.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
      <ScanProgressCard state={mockState(step)} />
    </ShowcaseSection>
  );
}
