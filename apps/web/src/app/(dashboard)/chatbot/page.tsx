import type { Metadata } from "next";
import { Chatbot } from "@/components/chatbot/chatbot";

export const metadata: Metadata = { title: "Quinchbot - Quinchool" };

/** A new chat. The first message is what actually creates one, so an abandoned
 * visit here leaves nothing behind. */
export default function ChatbotPage() {
  return <Chatbot />;
}
