import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { ConversationsClient } from "./ConversationsClient";

export const metadata: Metadata = { title: "Conversation History" };

export default async function ConversationsPage() {
  await requireAuth("/conversations");
  return <ConversationsClient />;
}
