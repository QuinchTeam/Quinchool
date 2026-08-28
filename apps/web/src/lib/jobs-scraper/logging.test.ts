import assert from "node:assert/strict";
import test from "node:test";

import { createJobsScraperLog } from "./logging.ts";

test("creates a structured jobs scraper log entry", () => {
  const entry = createJobsScraperLog("info", "scan.started", "scan-123", {
    documentCount: 4,
  });

  assert.equal(entry.level, "info");
  assert.equal(entry.service, "jobs-scraper");
  assert.equal(entry.event, "scan.started");
  assert.equal(entry.scanId, "scan-123");
  assert.equal(entry.documentCount, 4);
  assert.equal(Number.isNaN(Date.parse(entry.timestamp)), false);
  assert.doesNotThrow(() => JSON.stringify(entry));
});
