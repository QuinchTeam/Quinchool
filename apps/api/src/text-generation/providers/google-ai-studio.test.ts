import * as assert from "node:assert/strict";
import { test } from "node:test";

import { prepareGoogleJsonSchema } from "./google-ai-studio";

test("removes nested maxItems constraints rejected by Gemini", () => {
  assert.deepEqual(
    prepareGoogleJsonSchema({
      type: "array",
      maxItems: 30,
      items: { type: "array", maxItems: 8, items: { type: "string" } },
    }),
    {
      type: "array",
      items: { type: "array", items: { type: "string" } },
    },
  );
});
