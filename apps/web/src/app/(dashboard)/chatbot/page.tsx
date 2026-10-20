import type { Metadata } from "next";

import { ChatbotPage } from "@/features/chatbot/components/chatbot-page";

// Visiting New chat creates no row until the first message is sent.
export const metadata: Metadata = { title: "Chatbot - Quinchool" };

export default function Page() {
  return <ChatbotPage />;
}
