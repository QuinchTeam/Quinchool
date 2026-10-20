import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import {
  dayPeriod,
  greetingMessage,
  manilaClock,
} from "@/features/dashboard/lib/greeting";

test("periods follow the Philippine greeting hours", () => {
  assert.equal(dayPeriod(4), "night");
  assert.equal(dayPeriod(5), "morning");
  assert.equal(dayPeriod(11), "morning");
  assert.equal(dayPeriod(12), "afternoon");
  assert.equal(dayPeriod(17), "afternoon");
  assert.equal(dayPeriod(18), "evening");
  assert.equal(dayPeriod(21), "evening");
  assert.equal(dayPeriod(22), "night");
  assert.equal(dayPeriod(0), "night");
});

test("every weekday has a message for every period", () => {
  for (let day = 0; day < 7; day++) {
    for (const period of [
      "morning",
      "afternoon",
      "evening",
      "night",
    ] as const) {
      assert.ok(greetingMessage(day, period).length > 0);
    }
  }
});

test("reads the Manila clock, not the machine's", () => {
  assert.deepEqual(manilaClock(new Date("2026-10-18T13:30:00Z")), {
    hour: 21,
    weekday: 0,
  });
});
