"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";

import {
  DitherCanvas,
  type DitherSceneFn,
} from "@/components/shared/dither-canvas";
import { Card } from "@/components/ui/card";
import type { JobScraperState } from "@/features/jobs-scraper/lib/types";
import { cn } from "@/lib/utils";

export type ScanStep = "SEARCHING" | "READING" | "ANALYZING" | "SAVING";

const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.hypot(x - cx, y - cy);
// Deterministic 0..1 noise so line lengths stay put between frames.
const hash = (n: number) => {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

const BACKGROUND = 0.05;

// Drifting interference waves, used as the card's moving dither background.
const CARD_TEXTURE: DitherSceneFn = (x, y, t) =>
  0.04 +
  0.18 *
    (0.5 + 0.5 * Math.sin((x + y) * 18 - t * 1.5)) *
    (0.5 + 0.5 * Math.sin((x - y) * 9 + t * 0.8));

// Records drop onto a growing stack, which clears once it holds four.
const STACK_TOPS = [0.74, 0.6, 0.46, 0.32];
const RECORD_HEIGHT = 0.1;
const onRecord = (x: number, y: number, top: number, width: number) =>
  y > top && y < top + RECORD_HEIGHT && Math.abs(x - 0.5) < width / 2;

// One dither scene per step; brightness 0..1 at normalized (x, y) and time t.
const SCENES: Record<ScanStep, DitherSceneFn> = {
  // Radar sweep: the beam circles the board, leaving a fading trail over the rings.
  SEARCHING: (x, y, t) => {
    const d = dist(x, y, 0.5, 0.5);
    if (d > 0.46) return BACKGROUND;
    if (d < 0.03) return 1;
    const angle = Math.atan2(y - 0.5, x - 0.5);
    const behind =
      (((t * 2.2 - angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const trail = Math.max(0, 1 - behind / 1.4) * (1 - d * 0.8);
    const ring = [0.15, 0.3, 0.45].some((r) => Math.abs(d - r) < 0.012);
    return Math.max(ring ? 0.45 : BACKGROUND, trail);
  },
  // A page of text lines scrolls up while a highlight band reads down it.
  READING: (x, y, t) => {
    if (x < 0.18 || x > 0.82 || y < 0.08 || y > 0.92) return BACKGROUND;
    if (x < 0.2 || x > 0.8 || y < 0.1 || y > 0.9) return 0.5;
    const scroll = y + t * 0.08;
    const row = Math.floor(scroll / 0.09);
    const onLine =
      scroll % 0.09 < 0.035 && x > 0.27 && x < 0.27 + 0.2 + 0.3 * hash(row);
    const band = Math.abs(y - (0.1 + ((t * 0.3) % 0.8))) < 0.04 ? 0.3 : 0;
    return (onLine ? 0.9 : 0.14) + band;
  },
  // A pulsing core with orbiting dots and outward ripples: the AI thinking.
  ANALYZING: (x, y, t) => {
    const d = dist(x, y, 0.5, 0.5);
    if (d < 0.1 + 0.03 * Math.sin(t * 3)) return 1;
    const orbits: [number, number, number][] = [
      [0.22, 1.6, 0],
      [0.32, -1.1, 2],
      [0.42, 0.7, 4],
    ];
    for (const [r, speed, offset] of orbits) {
      const a = t * speed + offset;
      if (dist(x, y, 0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)) < 0.04)
        return 0.95;
      if (Math.abs(d - r) < 0.006) return 0.3;
    }
    const ripple = (((d - t * 0.25) % 0.2) + 0.2) % 0.2;
    return ripple < 0.02 && d < 0.48 ? 0.4 * (1 - d) : BACKGROUND;
  },
  // Result records drop in one at a time and settle onto a growing stack.
  SAVING: (x, y, t) => {
    const cycle = t % (STACK_TOPS.length + 1);
    const stacked = Math.floor(cycle);
    for (let i = 0; i < Math.min(stacked, STACK_TOPS.length); i++) {
      // Each record has a brighter header strip, like a saved row.
      const top = STACK_TOPS[i] ?? 0;
      if (onRecord(x, y, top, 0.56 - i * 0.02)) return y < top + 0.03 ? 1 : 0.7;
    }
    if (stacked < STACK_TOPS.length) {
      const progress = cycle - stacked;
      const target = STACK_TOPS[stacked] ?? 0;
      // Ease in so the record accelerates like it's falling.
      const top =
        -RECORD_HEIGHT + (target + RECORD_HEIGHT) * progress * progress;
      if (onRecord(x, y, top, 0.56 - stacked * 0.02)) return 0.95;
    }
    return BACKGROUND;
  },
};

// Each label reads as upcoming, in progress, or finished.
const STEPS: { id: ScanStep; label: string; active: string; done: string }[] = [
  { id: "SEARCHING", label: "Search", active: "Searching…", done: "Searched" },
  { id: "READING", label: "Read", active: "Reading…", done: "Read" },
  { id: "ANALYZING", label: "Analyze", active: "Analyzing…", done: "Analyzed" },
  { id: "SAVING", label: "Save", active: "Saving…", done: "Saved" },
];

function describe(step: ScanStep, count: number | null): string {
  const jobs = (noun: string) =>
    count === null ? `${noun}s` : `${count} ${noun}${count === 1 ? "" : "s"}`;
  switch (step) {
    case "SEARCHING":
      return "Looking for fresh job posts that fit your criteria…";
    case "READING":
      return `Opening ${jobs("job post")} to read the details…`;
    case "ANALYZING":
      return `Quinchbot is checking ${jobs("job")} against your criteria…`;
    case "SAVING":
      return "Almost done, saving your matches…";
  }
}

export function ScanDither({ step }: { step: ScanStep }) {
  return (
    <div className="size-28 shrink-0 rounded-xl border-2 border-primary/25 p-1">
      <div className="size-full overflow-hidden rounded-lg bg-muted text-primary">
        <DitherCanvas scene={SCENES[step]} className="size-full" />
      </div>
    </div>
  );
}

// Steps come from the API's saved scan status, so a refreshed page resumes on the right one.
export function ScanProgressCard({ state }: { state: JobScraperState }) {
  const step = state.scan.step ?? "SEARCHING";
  const current = STEPS.findIndex(({ id }) => id === step);

  return (
    <Card
      variant="minimal"
      className="relative overflow-hidden border-dashed border-primary/25"
    >
      <DitherCanvas
        scene={CARD_TEXTURE}
        pixelSize={3}
        className="pixelated pointer-events-none absolute inset-0 size-full text-primary opacity-25"
      />
      <div className="relative grid justify-items-center gap-5 py-4 text-center">
        {/* Keyed by step so each change remounts and plays the enter animation. */}
        <div
          key={step}
          className="animate-in duration-500 fade-in-0 zoom-in-95 motion-reduce:animate-none"
        >
          <ScanDither step={step} />
        </div>

        <p
          key={`${step}-text`}
          aria-live="polite"
          className="animate-in font-mono text-sm text-muted-foreground duration-500 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
        >
          {describe(step, state.scan.stepCount)}
        </p>

        <ol className="flex w-full max-w-md">
          {STEPS.map(
            ({ id, label, active: activeLabel, done: doneLabel }, index) => {
              const done = index < current;
              const active = index === current;

              return (
                <li key={id} className="grid flex-1 justify-items-center gap-2">
                  <div className="flex w-full items-center">
                    <span
                      className={cn(
                        "h-0.5 flex-1 transition-colors duration-500",
                        index === 0
                          ? "invisible"
                          : index <= current
                            ? "bg-primary"
                            : "bg-border",
                      )}
                    />
                    <span
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold transition-colors duration-500",
                        done &&
                          "border-primary bg-primary text-primary-foreground",
                        // The ring itself is the spinner; the number inside stays still.
                        active && "border-primary/25 text-primary",
                        !done && !active && "text-muted-foreground",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute -inset-0.5 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary"
                        />
                      ) : null}
                      {done ? (
                        <CheckIcon weight="regular" className="size-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "h-0.5 flex-1 transition-colors duration-500",
                        index === STEPS.length - 1
                          ? "invisible"
                          : index < current
                            ? "bg-primary"
                            : "bg-border",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-mono text-xs transition-colors duration-500",
                      active ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {done ? doneLabel : active ? activeLabel : label}
                  </span>
                </li>
              );
            },
          )}
        </ol>
      </div>
    </Card>
  );
}
