import assert from "node:assert/strict";
import test from "node:test";
import { apiTracePropagationTargets } from "../../../../src/lib/observability/trace-propagation.ts";

test("trace headers reach only the configured API base and its paths", () => {
  const [target] = apiTracePropagationTargets("https://api.example.com/v1/");
  assert.ok(target.test("https://api.example.com/v1"));
  assert.ok(target.test("https://api.example.com/v1/chatbot?limit=5"));
  assert.equal(target.test("https://api.example.com/v10/chatbot"), false);
  assert.equal(target.test("https://api.example.com.evil.test/v1"), false);
  assert.equal(target.test("https://apiXexample.com/v1"), false);
  assert.equal(target.test("https://third-party.test/v1"), false);
});
