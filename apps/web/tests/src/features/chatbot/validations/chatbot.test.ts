import assert from "node:assert/strict";
import test from "node:test";

import {
  chatbotRequestSchema,
  chatTitleSchema,
} from "@/features/chatbot/validations/chatbot";

test("a first message needs no chat id, and a follow-up carries one", () => {
  const request = {
    content: "Help me plan my week.",
    modelId: "gemini-3.1-flash-lite",
  };

  assert.equal(chatbotRequestSchema.safeParse(request).success, true);
  assert.equal(
    chatbotRequestSchema.safeParse({ ...request, chatId: "chat-1" }).success,
    true,
  );
  assert.equal(
    chatbotRequestSchema.safeParse({ ...request, content: "   " }).success,
    false,
  );
});

test("a chat title cannot be blank", () => {
  assert.equal(chatTitleSchema.safeParse({ title: "Week plan" }).success, true);
  assert.equal(chatTitleSchema.safeParse({ title: "  " }).success, false);
});
