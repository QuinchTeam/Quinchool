"use client";

import { useEffect, useRef } from "react";

const FPS = 12;
// Quantize brightness to six levels instead of a binary on/off pattern.
const LEVELS = 6;

// Center Bayer thresholds within each of the 64 brightness intervals.
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

// Returns brightness from 0 to 1 at normalized (x, y) and time in seconds.
export type DitherSceneFn = (x: number, y: number, t: number) => number;

/* Sample the scene into six brightness levels using Bayer thresholds.
   Paint alpha in the text color; reduced-motion users get one frame.
   A low frame rate keeps the animation's stepped motion.
   Pass a module-level scene so the effect doesn't restart every render.
   pixelSize > 0 renders coarse CSS-pixel dots instead of device pixels, which keeps
   large surfaces like a card background cheap; x and y normalize per axis. */
export function DitherCanvas({
  className,
  pixelSize = 0,
  scene,
}: {
  className?: string;
  pixelSize?: number;
  scene: DitherSceneFn;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const scale = pixelSize > 0 ? 1 / pixelSize : window.devicePixelRatio;
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    canvas.width = width;
    canvas.height = height;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const image = context.createImageData(width, height);
    // Convert any CSS text color to RGB through the canvas context.
    context.fillStyle = getComputedStyle(canvas).color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

    const draw = (t: number) => {
      const data = image.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const value = Math.min(
            1,
            Math.max(0, scene((x + 0.5) / width, (y + 0.5) / height, t)),
          );
          const scaled = value * (LEVELS - 1);
          const base = Math.floor(scaled);
          const threshold =
            BAYER[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)] ?? 1;
          const level = base + (scaled - base > threshold ? 1 : 0);
          const i = (y * width + x) * 4;
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
      if (now - last > 1000 / FPS) {
        last = now;
        draw(now / 1000);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scene, pixelSize]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
