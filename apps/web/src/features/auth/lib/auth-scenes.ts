import type { DitherSceneFn } from "@/components/shared/dither-canvas";

const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.hypot(x - cx, y - cy);

// Faint drifting interference so the icon never sits on a flat fill.
const backdrop = (x: number, y: number, t: number) =>
  0.03 +
  0.1 *
    (0.5 + 0.5 * Math.sin((x + y) * 14 - t * 1.2)) *
    (0.5 + 0.5 * Math.sin((x - y) * 7 + t * 0.6));

// Soft radial glow that fades out by `radius`.
const glow = (d: number, radius: number, strength: number) =>
  Math.max(0, 1 - d / radius) ** 2 * strength;

// Ball shading lit from the top-left, for round shapes like heads and cores.
const sphere = (x: number, y: number, cx: number, cy: number, r: number) =>
  0.45 +
  0.55 * Math.max(0, 1 - dist(x, y, cx - r * 0.4, cy - r * 0.4) / (r * 1.4));

// One dither icon per auth page; brightness 0..1 at normalized (x, y) and time t.
export const AUTH_SCENES = {
  // Padlock, on a 4s loop: sits locked while a glint sweeps it, unlocks (keyhole flashes,
  // shackle pops up and the right leg leaves the body), stays open, then snaps shut.
  login: (x, y, t) => {
    const p = t % 4;
    const open = 0.12;
    const lift =
      p < 1.6
        ? 0
        : p < 2.1
          ? open * (1 - (1 - (p - 1.6) / 0.5) ** 3)
          : p < 3.5
            ? open
            : p < 3.7
              ? open * (1 - (p - 3.5) / 0.2)
              : 0;
    const locked = lift < 0.005;
    const top = 0.42 - lift;
    if (x > 0.24 && x < 0.76 && y > 0.45 && y < 0.86) {
      const edge = x < 0.27 || x > 0.73 || y < 0.48 || y > 0.83;
      if (edge) return 0.95;
      const holeDist = dist(x, y, 0.5, 0.6);
      const unlocking = p > 1.5 && p < 2.4 ? 1 - Math.abs(p - 1.8) / 0.6 : 0;
      if (
        holeDist < 0.055 ||
        (Math.abs(x - 0.5) < 0.022 && y > 0.6 && y < 0.74)
      )
        return 0.05 + glow(holeDist, 0.08, 0.2 + 0.7 * unlocking);
      // Lit from the top-left; a diagonal glint crosses once while it sits locked.
      const shade = 0.75 - (x - 0.24) * 0.35 - (y - 0.45) * 0.45;
      const sweep = (p / 1.6) * 1.4 - 0.5;
      const glint = p < 1.6 && Math.abs(x + y - 0.9 - sweep) < 0.05 ? 0.3 : 0;
      return shade + glint;
    }
    const ring = dist(x, y, 0.5, top);
    if (Math.abs(ring - 0.17) < 0.035 && y < top)
      return 0.55 + 0.45 * (1 - (x - 0.33) / 0.34);
    // The left leg is longer and stays seated; the right leg lifts clear of the body.
    if (Math.abs(x - 0.33) < 0.035 && y >= top && y < 0.46) return 0.95;
    if (Math.abs(x - 0.67) < 0.035 && y >= top && y < 0.46 - lift) return 0.6;
    const shadow = y > 0.86 && y < 0.9 && Math.abs(x - 0.5) < 0.24 ? -0.03 : 0;
    return (
      backdrop(x, y, t) +
      shadow +
      glow(dist(x, y, 0.5, 0.65), 0.45, locked ? 0.15 : 0.05)
    );
  },
  // A simple user glyph (round head, wide shoulders) beside a glowing plus: a new account joining.
  register: (x, y, t) => {
    const cx = 0.42;
    if (dist(x, y, cx, 0.4) < 0.15) return sphere(x, y, cx, 0.4, 0.15);
    const shoulders = ((x - cx) / 0.3) ** 2 + ((y - 0.88) / 0.3) ** 2;
    if (shoulders < 1 && y < 0.88) return sphere(x, y, cx, 0.78, 0.3);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const px = Math.abs(x - 0.8);
    const py = Math.abs(y - 0.24);
    if ((px < 0.08 && py < 0.025) || (py < 0.08 && px < 0.025))
      return 0.6 + 0.4 * pulse;
    // Sparks orbit the plus.
    for (let i = 0; i < 3; i++) {
      const a = t * 1.8 + (i * Math.PI * 2) / 3;
      if (
        dist(x, y, 0.8 + Math.cos(a) * 0.13, 0.24 + Math.sin(a) * 0.13) < 0.018
      )
        return 0.85;
    }
    return backdrop(x, y, t) + glow(dist(x, y, 0.8, 0.24), 0.18, 0.35 * pulse);
  },
  // A bobbing envelope with a pulsing seal, sending ripples upward.
  forget: (x, y, t) => {
    const by = y - Math.sin(t * 2) * 0.03;
    if (x > 0.18 && x < 0.82 && by > 0.4 && by < 0.8) {
      if (x < 0.205 || x > 0.795 || by < 0.425 || by > 0.775) return 0.95;
      const flapY = 0.4 + 0.22 * (1 - Math.abs(x - 0.5) / 0.32);
      if (Math.abs(by - flapY) < 0.025) return 1;
      if (dist(x, by, 0.5, 0.6) < 0.045) return 0.6 + 0.4 * Math.sin(t * 4);
      // The flap above the fold sits in shade; the paper below catches the light.
      return by < flapY ? 0.45 + (by - 0.4) * 0.8 : 0.8 - (by - flapY) * 0.9;
    }
    const d = dist(x, by, 0.5, 0.4);
    const ripple = (((d - t * 0.2) % 0.14) + 0.14) % 0.14;
    if (by < 0.4 && ripple < 0.025 && d < 0.42) return 0.85 * (1 - d / 0.42);
    return backdrop(x, y, t);
  },
  // A refresh ring with an arrowhead spins around a glowing core and an orbiting spark.
  update: (x, y, t) => {
    const d = dist(x, y, 0.5, 0.5);
    const core = 0.09 + 0.02 * Math.sin(t * 3);
    if (d < core) return sphere(x, y, 0.5, 0.5, core) + 0.2;
    const turn = Math.PI * 2;
    const spin = t * 2;
    const angle =
      (((Math.atan2(y - 0.5, x - 0.5) - spin) % turn) + turn) % turn;
    if (Math.abs(d - 0.3) < 0.045 && angle > 1.1)
      return (
        0.25 + 0.75 * (angle / turn) + (Math.abs(d - 0.3) < 0.012 ? 0.1 : 0)
      );
    // Arrowhead just past the bright end of the ring (angle wraps from 2π to 0 there).
    const head = spin + 0.12;
    const hx = 0.5 + Math.cos(head) * 0.3;
    const hy = 0.5 + Math.sin(head) * 0.3;
    if (dist(x, y, hx, hy) < 0.08 && angle < 0.35) return 1;
    const sparkAngle = -t * 3.2;
    if (
      dist(
        x,
        y,
        0.5 + Math.cos(sparkAngle) * 0.18,
        0.5 + Math.sin(sparkAngle) * 0.18,
      ) < 0.025
    )
      return 0.9;
    return backdrop(x, y, t) + glow(d, 0.24, 0.4);
  },
} satisfies Record<string, DitherSceneFn>;

export type AuthScene = keyof typeof AUTH_SCENES;
