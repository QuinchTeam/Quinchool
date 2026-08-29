import * as assert from "node:assert/strict";
import { test } from "node:test";

import {
  jobScraperConfigSchema,
  mapScanFailure,
  scanRequestSchema,
} from "./scan-contract";

const validConfig = {
  roles: ["Software Engineer"],
  includedLevels: ["Junior"],
  requiredTechnologies: ["TypeScript"],
  excludedLevels: ["Senior"],
  excludedTechnologies: ["Java"],
  sources: ["LinkedIn"],
  timeRange: "TODAY",
  customStartDate: null,
  customEndDate: null,
  worldwideWorkModes: ["Remote"],
  philippinesWorkModes: [],
};

test("dedupes criteria case-insensitively and keeps the first spelling", () => {
  const parsed = jobScraperConfigSchema.parse({
    ...validConfig,
    roles: ["Software Engineer", "software engineer", "Full Stack Engineer"],
  });

  assert.deepEqual(parsed.roles, ["Software Engineer", "Full Stack Engineer"]);
});

test("rejects a config with no location and work mode selected", () => {
  const parsed = jobScraperConfigSchema.safeParse({
    ...validConfig,
    worldwideWorkModes: [],
    philippinesWorkModes: [],
  });

  assert.equal(parsed.success, false);
  assert.match(parsed.error!.issues[0]!.message, /at least one location/);
});

test("a CUSTOM range needs both dates", () => {
  const parsed = jobScraperConfigSchema.safeParse({
    ...validConfig,
    timeRange: "CUSTOM",
    customStartDate: "2026-08-20",
    customEndDate: null,
  });

  assert.equal(parsed.success, false);
  assert.match(parsed.error!.issues[0]!.message, /both custom range dates/);
});

test("a CUSTOM range may not run backwards", () => {
  const parsed = jobScraperConfigSchema.safeParse({
    ...validConfig,
    timeRange: "CUSTOM",
    customStartDate: "2026-08-25",
    customEndDate: "2026-08-20",
  });

  assert.equal(parsed.success, false);
  assert.match(parsed.error!.issues[0]!.message, /start on or before/);
});

test("an old but well-formed CUSTOM range still scans", () => {
  // The seven-day recency rule belongs to saving a config, not running a scan.
  const parsed = jobScraperConfigSchema.safeParse({
    ...validConfig,
    timeRange: "CUSTOM",
    customStartDate: "2020-01-01",
    customEndDate: "2020-01-05",
  });

  assert.equal(parsed.success, true);
});

test("scanId and scannedAt are optional", () => {
  const parsed = scanRequestSchema.safeParse({ config: validConfig });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data!.scanId, undefined);
});

test("forwards the AI service's own wording and retryable status", () => {
  const failure = mapScanFailure(503, {
    error: "Crawl4AI is offline. Start the crawl4ai Docker service.",
  });

  assert.equal(failure.status, 503);
  assert.match(failure.message, /Crawl4AI is offline/);
});

test("falls back to 502 when the AI service answers with a non-HTTP status", () => {
  const failure = mapScanFailure(0, null);

  assert.equal(failure.status, 502);
  assert.match(failure.message, /The AI service returned 0/);
});
