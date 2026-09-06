import type { Metadata } from "next";
import { Chatbot } from "@/components/chatbot/chatbot";

export const metadata: Metadata = { title: "Quinchbot - Quinchool" };

export default function ChatbotPage() {
  return <Chatbot />;
}
