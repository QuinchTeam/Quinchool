import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { pageItems } from "../../../../../src/features/finance-tracker/lib/pagination.ts";

test("page items keep first, last and neighbours, collapsing larger gaps", () => {
  assert.deepEqual(pageItems(1, 1), [1]);
  assert.deepEqual(pageItems(1, 3), [1, 2, 3]);
  assert.deepEqual(pageItems(1, 20), [1, 2, "gap", 20]);
  assert.deepEqual(pageItems(4, 20), [1, 2, 3, 4, 5, "gap", 20]);
  assert.deepEqual(pageItems(6, 20), [1, "gap", 5, 6, 7, "gap", 20]);
  assert.deepEqual(pageItems(20, 20), [1, "gap", 19, 20]);
});
