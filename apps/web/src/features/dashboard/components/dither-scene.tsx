"use client";

import {
  DitherCanvas,
  type DitherSceneFn,
} from "@/components/shared/dither-canvas";
import type { DayPeriod } from "@/features/dashboard/lib/greeting";

const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.hypot(x - cx, y - cy);
const disk = (x: number, y: number, cx: number, cy: number, r: number) =>
  dist(x, y, cx, cy) < r;
const glow = (x: number, y: number, cx: number, cy: number, r: number) =>
  Math.max(0, 1 - dist(x, y, cx, cy) / r);
const sky = (y: number, top: number, bottom: number) =>
  top + (bottom - top) * y;
// Overlapping disks and a flat base make a cloud that wraps across the scene.
const cloud = (
  x: number,
  y: number,
  t: number,
  speed: number,
  cy: number,
  s: number,
) => {
  const cx = ((t * speed + cy * 3) % 1.6) - 0.3;
  return (
    disk(x, y, cx, cy, 0.07 * s) ||
    disk(x, y, cx + 0.07 * s, cy - 0.03 * s, 0.08 * s) ||
    disk(x, y, cx + 0.15 * s, cy, 0.06 * s) ||
    (Math.abs(y - (cy + 0.03 * s)) < 0.03 * s && x > cx && x < cx + 0.15 * s)
  );
};

// Star tuples are [x, y, twinkle phase, size] in normalized scene coordinates.
const STARS = [
  [0.12, 0.14, 0, 0.022],
  [0.3, 0.08, 1.7, 0.014],
  [0.18, 0.4, 3.1, 0.018],
  [0.08, 0.66, 5.9, 0.012],
  [0.26, 0.86, 0.9, 0.016],
  [0.5, 0.92, 2.2, 0.012],
  [0.86, 0.12, 2.4, 0.016],
  [0.92, 0.5, 4.2, 0.012],
  [0.78, 0.84, 5.3, 0.02],
  [0.6, 0.06, 0.6, 0.012],
] as const;

// Scenes return brightness from 0 to 1 at normalized (x, y) and time in seconds.
const SCENES: Record<DayPeriod, DitherSceneFn> = {
  // Layer the rising sun behind rolling hills and drifting clouds.
  morning: (x, y, t) => {
    const sunY = 0.6 - 0.04 * Math.sin(t * 0.7);
    const front = 0.8 + 0.05 * Math.sin(x * 6 + 1);
    const back = 0.72 + 0.06 * Math.sin(x * 4.2 + 2.5);
    if (y > front) return 0.92 - (y - front) * 0.6;
    if (y > back) return 0.55;
    if (cloud(x, y, t, 0.05, 0.26, 1.1) || cloud(x, y, t, 0.03, 0.44, 0.8))
      return 0.8;
    if (disk(x, y, 0.5, sunY, 0.16)) return 1;
    const rays =
      0.5 + 0.5 * Math.cos(Math.atan2(y - sunY, x - 0.5) * 10 + t * 0.6);
    return Math.max(
      sky(y, 0.08, 0.34),
      glow(x, y, 0.5, sunY, 0.5) * (0.45 + 0.35 * rays),
    );
  },
  // Draw the sun's corona and rotating rays above a passing cloud.
  afternoon: (x, y, t) => {
    if (cloud(x, y, t, 0.04, 0.74, 1.3)) return 0.85;
    const d = dist(x, y, 0.5, 0.42);
    if (d < 0.15) return 1;
    if (d > 0.19 && d < 0.215) return 0.95;
    const spike = Math.cos(Math.atan2(y - 0.42, x - 0.5) * 12 - t * 0.9);
    if (d < 0.44 && spike > 0.9) return 0.9 - d;
    return Math.max(sky(y, 0.32, 0.1), glow(x, y, 0.5, 0.42, 0.5) * 0.55);
  },
  // Stripe the setting sun and ripple its reflection below the horizon.
  evening: (x, y, t) => {
    const horizon = 0.6;
    if (y < horizon) {
      if (disk(x, y, 0.5, horizon, 0.28)) {
        // Widen and scroll the stripe gaps toward the horizon.
        const depth = (y - (horizon - 0.28)) / 0.28;
        const stripe = (((y * 26 - t * 0.6) % 1) + 1) % 1;
        return depth > 0.35 && stripe < depth * 0.55 ? 0.15 : 1;
      }
      return Math.max(
        sky(y, 0.06, 0.38),
        glow(x, y, 0.5, horizon, 0.62) * 0.65,
      );
    }
    const depth = (y - horizon) / (1 - horizon);
    const wobble = 0.03 * Math.sin(y * 40 - t * 2);
    const width = 0.26 * (1 - depth * 0.6);
    if (Math.abs(x - 0.5 + wobble) < width && Math.sin(y * 70 - t * 3) > -0.1)
      return 0.85 - depth * 0.3;
    const sparkle = Math.sin(x * 53 + t * 4) * Math.sin(y * 71 - t * 3);
    return sparkle > 0.92 ? 0.7 : 0.14 + 0.08 * depth;
  },
  // Combine a crescent moon, twinkling stars, and a periodic shooting star.
  night: (x, y, t) => {
    const mx = 0.5;
    const my = 0.48;
    const mr = 0.27;
    const d = dist(x, y, mx, my);
    if (d < mr) {
      // Approximate a sphere normal and light it from the left to form the crescent.
      const nx = (x - mx) / mr;
      const ny = (y - my) / mr;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const light = Math.max(0, -0.85 * nx - 0.25 * ny + 0.45 * nz);
      const crater =
        glow(x, y, 0.4, 0.52, 0.06) +
        glow(x, y, 0.46, 0.66, 0.045) +
        glow(x, y, 0.36, 0.38, 0.04) +
        glow(x, y, 0.55, 0.36, 0.035);
      // Earthshine keeps the unlit side faintly visible.
      return Math.max(0.16, light * (1 - 0.55 * Math.min(1, crater * 1.6)));
    }
    if (d < mr + 0.08)
      return Math.max(sky(y, 0.04, 0.16), (mr + 0.08 - d) * 3.2);
    if (cloud(x, y, t, 0.02, 0.8, 1.6) || cloud(x, y, t, 0.015, 0.2, 1.2))
      return 0.2;
    for (const [sx, sy, phase, size] of STARS) {
      const d = dist(x, y, sx, sy);
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2.2 + phase);
      if (d < size) return 0.55 + 0.45 * twinkle;
      const onCross = Math.abs(x - sx) < 0.006 || Math.abs(y - sy) < 0.006;
      if (twinkle > 0.7 && onCross && d < size * 2.6) return 0.6;
    }
    // A shooting star crosses the scene every seven seconds.
    const p = (t % 7) / 1.2;
    if (p < 1) {
      const hx = 0.1 + p * 0.5;
      const hy = 0.08 + p * 0.22;
      const along = (x - hx) * 0.92 + (y - hy) * 0.4;
      const across = Math.abs((x - hx) * -0.4 + (y - hy) * 0.92);
      if (along < 0 && along > -0.18 && across < 0.012) return 0.95 + along * 2;
    }
    return sky(y, 0.04, 0.2);
  },
};

export function DitherScene({ period }: { period: DayPeriod }) {
  return (
    <div className="size-20 shrink-0 rounded-xl border-2 p-1">
      <div className="size-full overflow-hidden rounded-lg bg-muted text-primary">
        <DitherCanvas scene={SCENES[period]} className="size-full" />
      </div>
    </div>
  );
}
