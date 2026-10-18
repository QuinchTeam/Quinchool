import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import {
  normalizePastedText,
  parsePastedBullets,
} from "@/features/career-profile/lib/normalize-pasted-text";

test("joins hard-wrapped lines into one", () => {
  assert.equal(
    normalizePastedText("AI-powered image,\nvideo, and audio\r\n  generation."),
    "AI-powered image, video, and audio generation.",
  );
});

test("drops a leading bullet mark but keeps inner dashes", () => {
  assert.equal(
    normalizePastedText("• Led a team-wide migration"),
    "Led a team-wide migration",
  );
  assert.equal(normalizePastedText("- Shipped v2"), "Shipped v2");
});

test("splits marked bullets and joins their hard wraps", () => {
  assert.deepEqual(
    parsePastedBullets(
      "• Led Influencers Studio, enabling AI image,\nvideo, and audio.\n• Built Astro sites.\n",
    ),
    [
      "Led Influencers Studio, enabling AI image, video, and audio.",
      "Built Astro sites.",
    ],
  );
});

test("unmarked text becomes one bullet per line", () => {
  assert.deepEqual(parsePastedBullets("First\n\nSecond"), ["First", "Second"]);
});
