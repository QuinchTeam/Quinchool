import * as assert from "node:assert/strict";
import { test } from "node:test";

import { buildResumeSchema } from "./build-resume.contract";

test("accepts either pasted requirements or an owned saved-job id", () => {
  assert.equal(
    buildResumeSchema.safeParse({
      jobRequirement: "Build TypeScript APIs",
      modelId: "gemini-3.1-flash-lite",
    }).success,
    true,
  );
  assert.equal(
    buildResumeSchema.safeParse({
      jobId: "job-1",
      modelId: "gemini-3.1-flash-lite",
    }).success,
    true,
  );
  assert.equal(
    buildResumeSchema.safeParse({
      jobId: "job-1",
      jobRequirement: "conflicting source",
      modelId: "gemini-3.1-flash-lite",
    }).success,
    false,
  );
});
