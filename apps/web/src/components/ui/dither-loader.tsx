import { cn } from "@/lib/utils";

// 5x5 pixel grid; delay grows with distance from center so the wave ripples outward,
// with a checkerboard offset for a dithered look.
const DITHER_CELLS = Array.from({ length: 25 }, (_, index) => {
  const x = (index % 5) - 2;
  const y = Math.floor(index / 5) - 2;
  return -(Math.hypot(x, y) * 0.18 + ((x + y) & 1) * 0.09);
});

export function DitherLoader({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 grid-cols-5 gap-px text-primary",
        className,
      )}
    >
      {DITHER_CELLS.map((delay, index) => (
        <span
          key={index}
          className="bg-current animate-dither-cell motion-reduce:animate-none"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}
