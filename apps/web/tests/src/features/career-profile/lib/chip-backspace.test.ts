import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import { chipBackspace } from "@/features/career-profile/lib/chip-backspace";

test("backspace reopens the last chip minus one character", () => {
  assert.deepEqual(chipBackspace(["React", "PostgreSQL"], false), {
    chips: ["React"],
    draft: "PostgreSQ",
  });
});

test("restricted lists drop the whole chip", () => {
  assert.deepEqual(chipBackspace(["PostgreSQL"], true), {
    chips: [],
    draft: "",
  });
});

test("no chips is a no-op", () => {
  assert.deepEqual(chipBackspace([], false), { chips: [], draft: "" });
});
