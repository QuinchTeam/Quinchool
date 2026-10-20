import type { Metadata } from "next";
import { Chatbot } from "@/features/chatbot/components/chatbot";

export const metadata: Metadata = { title: "Quinchbot - Quinchool" };

// Visiting New chat creates no row until the first message is sent.
export default function ChatbotPage() {
  return <Chatbot />;
}
