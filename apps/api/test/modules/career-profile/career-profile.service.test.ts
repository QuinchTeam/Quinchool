import * as assert from "node:assert/strict";
import { test } from "node:test";

import type { CareerProfileRepository } from "../../../src/modules/career-profile/career-profile.repository";
import { CareerProfileService } from "../../../src/modules/career-profile/career-profile.service";

function service(stored: unknown, updated = 1) {
  const repository = {
    findResumeLayout: async () => (stored === undefined ? null : { resumeLayout: stored }),
    saveResumeLayout: async () => ({ count: updated }),
  } as unknown as CareerProfileRepository;
  return new CareerProfileService(repository);
}

test("resume layout falls back to empty when missing or malformed", async () => {
  const empty = { excluded: [], order: {} };
  assert.deepEqual(await service(undefined).getResumeLayout("u"), empty);
  assert.deepEqual(await service({ excluded: "nope" }).getResumeLayout("u"), empty);
  const saved = { excluded: ["exp:0"], order: { edu: [1, 0] } };
  assert.deepEqual(await service(saved).getResumeLayout("u"), saved);
});

test("saving a resume layout without a profile is a 404", async () => {
  await assert.rejects(
    service(undefined, 0).saveResumeLayout("u", { excluded: [], order: {} }),
    { status: 404 },
  );
});
