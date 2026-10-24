import type { SavedJob } from "@/features/jobs-scraper/lib/types";

// Inline brand marks: no static files, so the auth proxy never redirects them.
export function SourceLogo({ source }: { source: SavedJob["source"] }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
      {/* The visible name already labels it, so the mark is decorative. */}
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        {source === "LinkedIn" ? <LinkedInMark /> : <JobStreetMark />}
      </svg>
      {source}
    </span>
  );
}

function LinkedInMark() {
  return (
    <>
      <rect x="2" y="2" width="20" height="20" rx="2" fill="#fff" />
      <path
        fill="#0a66c2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"
      />
    </>
  );
}

// ponytail: hand-drawn approximation of the JobStreet dotted-arrow mark.
const ARROW_DOTS: [cx: number, cy: number, r: number][] = [
  [5.5, 12, 0.55],
  [7.5, 12, 0.7],
  [9.5, 12, 0.85],
  [11.5, 12, 1],
  [13.5, 12, 1.15],
  [15.5, 12, 1.3],
  [17.8, 12, 1.5],
  [15.5, 9.4, 1.2],
  [13.2, 6.9, 1.05],
  [15.5, 14.6, 1.2],
  [13.2, 17.1, 1.05],
];

function JobStreetMark() {
  return (
    <>
      <rect width="24" height="24" rx="5" fill="#e60278" />
      <circle cx="12" cy="12" r="9.5" fill="#0d3880" />
      {ARROW_DOTS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#fff" />
      ))}
    </>
  );
}
