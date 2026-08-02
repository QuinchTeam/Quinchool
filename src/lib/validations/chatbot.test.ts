import assert from "node:assert/strict";
import test from "node:test";

import { chatbotRequestSchema } from "./chatbot.ts";

test("accepts user-ended chat history and rejects assistant-ended history", () => {
  const request = {
    messages: [{ content: "Help me plan my week.", role: "user" }],
    modelId: "gemini-3.1-flash-lite",
  };

  assert.equal(chatbotRequestSchema.safeParse(request).success, true);
  assert.equal(
    chatbotRequestSchema.safeParse({
      ...request,
      messages: [{ content: "Here is the plan.", role: "assistant" }],
    }).success,
    false,
  );
});
