import type { Metadata } from "next";

import { ChatbotPage } from "@/features/chatbot/components/chatbot-page";

export const metadata: Metadata = { title: "Chatbot - Quinchool" };

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <ChatbotPage chatId={chatId} />;
}
