import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import {
  manilaNowKey,
  niceTicks,
} from "../../../../../src/features/finance-tracker/lib/chart.ts";

test("nice ticks start at zero, cover the max, and use round steps", () => {
  assert.deepEqual(niceTicks(0), [0, 1]);
  assert.deepEqual(niceTicks(73_000), [0, 20_000, 40_000, 60_000, 80_000]);
  assert.deepEqual(niceTicks(100), [0, 25, 50, 75, 100]);
  assert.deepEqual(niceTicks(9), [0, 2.5, 5, 7.5, 10]);
});

test("manila now key is UTC+8 wall-clock time", () => {
  assert.equal(
    manilaNowKey(new Date("2026-10-18T17:30:00Z")),
    "2026-10-19T01:30",
  );
});
