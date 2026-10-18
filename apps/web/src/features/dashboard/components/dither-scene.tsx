"use client";

import { useEffect, useRef } from "react";

import type { DayPeriod } from "@/features/dashboard/lib/greeting";

const FPS = 12;
/** Brightness steps. Dithering between neighbouring steps (not just on/off)
 * gives a real tonal range while keeping the dotted texture. */
const LEVELS = 6;

// 8x8 Bayer matrix built from the 2x2 base, normalized to (0, 1): the
// ordered-dither thresholds. 64 levels give smooth gradients at high res.
const BAYER_SIZE = 8;
const BAYER = (() => {
  let matrix = [
    [0, 2],
    [3, 1],
  ];
  while (matrix.length < BAYER_SIZE) {
    const n = matrix.length;
    const prev = matrix;
    matrix = Array.from({ length: n * 2 }, (_, y) =>
      Array.from(
        { length: n * 2 },
        (_, x) =>
          4 * (prev[y % n]?.[x % n] ?? 0) +
          ([0, 2, 3, 1][Math.floor(y / n) * 2 + Math.floor(x / n)] ?? 0),
      ),
    );
  }
  return matrix.flat().map((v) => (v + 0.5) / (BAYER_SIZE * BAYER_SIZE));
})();

const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.hypot(x - cx, y - cy);
const disk = (x: number, y: number, cx: number, cy: number, r: number) =>
  dist(x, y, cx, cy) < r;
const glow = (x: number, y: number, cx: number, cy: number, r: number) =>
  Math.max(0, 1 - dist(x, y, cx, cy) / r);
/** Vertical gradient so the whole tile carries the pattern, not just the subject. */
const sky = (y: number, top: number, bottom: number) =>
  top + (bottom - top) * y;
/** Puffy cloud: three overlapping circles and a flat base, drifting right and wrapping. */
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

// Fixed star field for the night scene: [x, y, phase, size].
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

/** Brightness (0–1) of point (x, y) in the unit square at time t seconds. */
const SCENES: Record<DayPeriod, (x: number, y: number, t: number) => number> = {
  // Sun rising behind rolling hills, clouds drifting across a pale sky.
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
  // High sun with a corona ring and slowly turning rays; a cloud passes below.
  afternoon: (x, y, t) => {
    if (cloud(x, y, t, 0.04, 0.74, 1.3)) return 0.85;
    const d = dist(x, y, 0.5, 0.42);
    if (d < 0.15) return 1;
    if (d > 0.19 && d < 0.215) return 0.95;
    const spike = Math.cos(Math.atan2(y - 0.42, x - 0.5) * 12 - t * 0.9);
    if (d < 0.44 && spike > 0.9) return 0.9 - d;
    return Math.max(sky(y, 0.32, 0.1), glow(x, y, 0.5, 0.42, 0.5) * 0.55);
  },
  // Retro striped sun sinking into the sea, its reflection rippling below.
  evening: (x, y, t) => {
    const horizon = 0.6;
    if (y < horizon) {
      if (disk(x, y, 0.5, horizon, 0.28)) {
        // Gaps widen toward the horizon and scroll down slowly.
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
  // Cratered crescent moon, twinkling stars and a passing shooting star.
  night: (x, y, t) => {
    const mx = 0.5;
    const my = 0.48;
    const mr = 0.27;
    const d = dist(x, y, mx, my);
    if (d < mr) {
      // Sphere normal, lit from the left: a crescent with a soft terminator.
      const nx = (x - mx) / mr;
      const ny = (y - my) / mr;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const light = Math.max(0, -0.85 * nx - 0.25 * ny + 0.45 * nz);
      const crater =
        glow(x, y, 0.4, 0.52, 0.06) +
        glow(x, y, 0.46, 0.66, 0.045) +
        glow(x, y, 0.36, 0.38, 0.04) +
        glow(x, y, 0.55, 0.36, 0.035);
      // Earthshine keeps the dark side faintly visible.
      return Math.max(0.16, light * (1 - 0.55 * Math.min(1, crater * 1.6)));
    }
    // Halo just outside the rim.
    if (d < mr + 0.08)
      return Math.max(sky(y, 0.04, 0.16), (mr + 0.08 - d) * 3.2);
    // Dim clouds drifting behind everything.
    if (cloud(x, y, t, 0.02, 0.8, 1.6) || cloud(x, y, t, 0.015, 0.2, 1.2))
      return 0.2;
    for (const [sx, sy, phase, size] of STARS) {
      const d = dist(x, y, sx, sy);
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2.2 + phase);
      // Bright core plus a faint cross that flares as the star twinkles.
      if (d < size) return 0.55 + 0.45 * twinkle;
      const onCross = Math.abs(x - sx) < 0.006 || Math.abs(y - sy) < 0.006;
      if (twinkle > 0.7 && onCross && d < size * 2.6) return 0.6;
    }
    // A shooting star every 7s, crossing the top-left on a diagonal.
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

/**
 * A small animated, ordered-dithered scene for the time of day. Draws in the
 * element's text color; holds still for prefers-reduced-motion.
 */
export function DitherScene({ period }: { period: DayPeriod }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const size = Math.round(canvas.clientWidth * window.devicePixelRatio);
    canvas.width = size;
    canvas.height = size;
    const scene = SCENES[period];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const image = context.createImageData(size, size);
    // Resolve the CSS text color (any format) to RGB via the 2D context.
    context.fillStyle = getComputedStyle(canvas).color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

    const draw = (t: number) => {
      const data = image.data;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const value = Math.min(
            1,
            Math.max(0, scene((x + 0.5) / size, (y + 0.5) / size, t)),
          );
          const scaled = value * (LEVELS - 1);
          const base = Math.floor(scaled);
          const threshold =
            BAYER[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)] ?? 1;
          const level = base + (scaled - base > threshold ? 1 : 0);
          const i = (y * size + x) * 4;
          data[i] = red ?? 0;
          data[i + 1] = green ?? 0;
          data[i + 2] = blue ?? 0;
          data[i + 3] = (level / (LEVELS - 1)) * 255;
        }
      }
      context.putImageData(image, 0, 0);
    };

    if (still) {
      draw(0);
      return;
    }
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      // Low frame rate on purpose: stepped motion suits the dither look.
      if (now - last > 1000 / FPS) {
        last = now;
        draw(now / 1000);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [period]);

  // Framed here so every use shares one look: thick outer ring, muted inner tile.
  return (
    <div className="size-20 shrink-0 rounded-xl border-2 p-1">
      <div className="size-full overflow-hidden rounded-lg bg-muted text-primary">
        <canvas ref={canvasRef} aria-hidden className="size-full" />
      </div>
    </div>
  );
}
