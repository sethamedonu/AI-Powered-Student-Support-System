import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = { title: "AI Chat" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ChatPage({ searchParams }: Props) {
  const user = await requireAuth("/chat");
  const params = await searchParams;
  return (
    <ChatClient
      user={user}
      initialCategory={(params["category"] as string) ?? "general"}
    />
  );
}
