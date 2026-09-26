import type { Metadata } from "next";
import { Chatbot } from "@/features/chatbot/components/chatbot";

export const metadata: Metadata = { title: "Quinchbot - Quinchool" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <Chatbot chatId={chatId} />;
}
