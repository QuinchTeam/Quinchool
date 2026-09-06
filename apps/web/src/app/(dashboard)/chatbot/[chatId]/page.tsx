import type { Metadata } from "next";
import { Chatbot } from "@/components/chatbot/chatbot";

export const metadata: Metadata = { title: "Quinchbot - Quinchool" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <Chatbot chatId={chatId} />;
}
