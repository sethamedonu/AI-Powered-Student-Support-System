import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { ConversationDetailClient } from "./ConversationDetailClient";

export const metadata: Metadata = { title: "Conversation" };

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationDetailPage({ params }: Props) {
  const user = await requireAuth();
  const { conversationId } = await params;
  return <ConversationDetailClient user={user} conversationId={conversationId} />;
}
